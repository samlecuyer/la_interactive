(function(L, Reveal) {
	'use strict';

	var doAnimate = {animate: true};

	var dataFetch = [];

	// some basic coordinates
	var coords = {
		'channel-islands': [
			{"lat":32.61161640317033,"lng":-120.49255371093749},
			{"lat":34.37064492478658,"lng":-118.0645751953125}
		],
		'city-hall': [34.0536, -118.243],
		'hollywood-sign': [34.134103, -118.321694],
		'point-dume': [34.000872, -118.806839],
		'palos-verdes': [33.758647, -118.345844],
		'orange-crush': [33.7801, -117.8792],
		'the-90': [[33.94093896671995,-118.46437454223633],[34.02861991381927,-118.36772918701172]]
	};
	// composite views
	coords['bay'] = [coords['point-dume'], coords['palos-verdes']];

	var map = L.map('map', {
		keyboard: false
	}).setView(coords['city-hall'], 11);

	var positron = L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
		maxZoom: 18,
		attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, ' +
			'&copy; <a href="http://cartodb.com/attributions">CartoDB</a>'
	}).addTo(map);

	function zoomToFeature(e) {
		map.fitBounds(e.target.getBounds());
	}

	function highlightFeature(e) {
	    var layer = e.target;
	    info.update(layer.feature.properties);
	}
	function resetHighlight(e) {
	    info.update();
	}

	function colorOfPlace(kind) {
		switch (kind) {
			case 'segment-of-a-city': return 'DodgerBlue';
			case 'standalone-city': return 'LightSkyBlue';
			case 'unincorporated-area': return 'LightGreen';
		}
	}

	var legend = L.control({position: 'bottomleft'});

	legend.onAdd = function (map) {

	    var div = L.DomUtil.create('div', 'info legend'),
	        grades = ['segment-of-a-city', 'standalone-city', 'unincorporated-area'],
	        labels = ['City Neighborhood', 'Standalone City', 'Unnincorporated Area'];

	    // loop through our density intervals and generate a label with a colored square for each interval
	    for (var i = 0; i < grades.length; i++) {
	        div.innerHTML +=
	            '<i style="background:' + colorOfPlace(grades[i]) + '"></i> ' + labels[i] + '<br>';
	    }

	    return div;
	};

	legend.addTo(map);

	var info = L.control();

	info.onAdd = function (map) {
	    this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
	    this.update();
	    return this._div;
	};

	// method that we will use to update the control based on feature properties passed
	info.update = function (props) {
	    this._div.innerHTML = (props ? '<b>' + (props.name || props.Name) + '</b>': 'Hover over an area');
	};

	info.addTo(map);

	function styleCity(feature) {
		return { 
			weight: 1,
			color: colorOfPlace(feature.properties.metadata.type),
			fillOpacity: 0.2
		};
	}
	function doInfoStuff(feature, layer) {
		layer.on({
	        mouseover: highlightFeature,
	        mouseout: resetHighlight
	     });
	}

	var regionNames = ['south-bay', 'harbor', 'south-la', 'central-la', 'san-gabriel-valley',
					   'san-fernando-valley',
					   'northeast-la', 'verdugos', 'westside', 'santa-monica-mountains'];
	var regionHoods = regionNames.reduce(function(prev, name) {
		prev[name] = L.geoJson(undefined, {
			onEachFeature: doInfoStuff,
			filter: function(feature, layer) {
				return feature.properties.metadata.region === name;
			},
			style: styleCity
		});
		return prev;
	}, {});

	var kinds = ['segment-of-a-city', 'standalone-city', 'unincorporated-area'];
	var countyHoods = kinds.reduce(function(prev, kind) {
		prev[kind] = L.geoJson(undefined, {
			onEachFeature: doInfoStuff,
			filter: function(feature, layer) {
				return feature.properties.metadata.type === kind;
			},
			style: styleCity
		});
		return prev;
	}, {});

	dataFetch.push(fetch('geojson/la-county-neighborhoods-current.json').then(function(resp) {
		return resp.json().then(function(data) {
			_.forIn(regionHoods, function(layer) {
				layer.addData(data);
			});
			_.forIn(countyHoods, function(layer) {
				layer.addData(data);
			});
		});
	}));

	var regions = L.geoJson(undefined, {
		onEachFeature: doInfoStuff,
		style: function(feature) {
			return { 
				weight: 1,
				color: 'orange'
			};
		}
	});

	var freeways = L.geoJson(undefined, {
		style: function(feature) {
			return { 
				weight: 3,
				color: 'orange'
			};
		}
	});

	var surroundingCounties = L.geoJson(undefined, {
		onEachFeature: doInfoStuff,
		style: function(feature) {
			return { 
				weight: 3,
				color: 'orange'
			};
		}
	});

	dataFetch.push(fetch('geojson/la-county-regions.json').then(function(resp) {
		return resp.json().then(function(data) {
			regions.addData(data);
		});
	}));

	dataFetch.push(fetch('geojson/surrounding.json').then(function(resp) {
		return resp.json().then(function(data) {
			surroundingCounties.addData(data);
		});
	}));
	
	dataFetch.push(fetch('geojson/freeways.json').then(function(resp) {
		return resp.json().then(function(data) {
			freeways.addData(data);
		});
	}));

	dataFetch.push(fetch('geojson/marina.json').then(function(resp) {
		return resp.json().then(function(data) {
			freeways.addData(data);
		});
	}));

	var markers = {
		'hollywood-sign': L.marker(coords['hollywood-sign']),
		'city-hall': L.marker(coords['city-hall']),
		'bradbury': L.marker([34.050536, -118.247861]),
		'bunker-hill': L.marker([34.052045, -118.250347]),
		'angels-flight': L.marker([34.051339, -118.250211])
	}

	var mapViews = {
		'initial': {
			layers: [],
			call: 'setView',
			callArgs: [coords['city-hall'], 11]
		},
		'neighborhoods': {
			layers: [countyHoods['segment-of-a-city']],
			call: 'fitBounds',
			callArgs: [countyHoods['segment-of-a-city'], doAnimate]
		},
		'neighborhoods+cities': {
			layers: countyHoods,
			call: 'fitBounds',
			callArgs: [countyHoods['unincorporated-area'], doAnimate]
		},
		'regions': {
			layers: [regions],
			call: 'fitBounds',
			callArgs: [regions, doAnimate]
		},
		'surrounding-counties': {
			layers: [surroundingCounties],
			call: 'fitBounds',
			callArgs: [surroundingCounties, doAnimate]
		},
		'freeways': {
			layers: [freeways],
			call: 'fitBounds',
			callArgs: [freeways, doAnimate]
		},
		'freeways-valley': {
			layers: [freeways, regionHoods['san-fernando-valley']],
			call: 'fitBounds',
			callArgs: [freeways, doAnimate]
		},
		'freeways-90': {
			layers: [freeways],
			call: 'fitBounds',
			callArgs: [coords['the-90'], doAnimate]
		},
	};

	regionNames.forEach(function(name) {
		mapViews[name] = {
			layers: [regionHoods[name]],
			call: 'fitBounds',
			callArgs: [regionHoods[name], doAnimate]
		}
	});

	function applyView(viewIndex, doZoom) {
		var view = mapViews[viewIndex];
		var cObj = coords[viewIndex]
		if (!view && cObj) {
			if (typeof cObj[0] === 'number') {
				map.setView(coords[viewIndex], 12, doAnimate);
			} else {
				map.fitBounds(coords[viewIndex], doAnimate);
			}
			return;
		}
		// filter all the layers, if provided
		// but if there's not a layers[], then don't
		if (view.layers !== undefined) {
			map.eachLayer(function(layer) {
				// TODO: it should be possible to not clear the map
				// but layer comparison is weird in leaflet
				if (layer !== positron) {
					map.removeLayer(layer);
				};
			});
			_.forEach(view.layers, function(layer) {
				if (!map.hasLayer(layer)) {
					map.addLayer(layer);
				}
			});
		}
		if (view.call && !doZoom) {
			map[view.call].apply(map, view.callArgs);
		}
	}

	function isFreeways(name) {
		return name.indexOf('freeways') === 0;
	}
	function applyHighlight(mapIndex, index, doZoom) {
		var isFreewaysRegion = isFreeways(mapIndex);
		var region = isFreewaysRegion ? freeways : regionHoods[mapIndex];
		if (!region) {
			return;
		}
		_.forIn(region._layers, function(feature) {
			region.resetStyle(feature);
		});
		if (index) {
			_.forEach(index.split(','), function(index) {
				var match = ['feature', 'properties', 'metadata', 'slug'];
				var styles = {
					weight: 4,
					fillOpacity: 0.6
				};
				if (isFreewaysRegion) {
					match = ['feature', 'properties', 'route'];
					styles = {
						color: 'orangered'
					}
				}
				var hood = _.find(region._layers, _.matchesProperty(match, index));
				hood.setStyle(styles);
				// this doesn't work with more than one hilight
				if (doZoom) {
					map.fitBounds(hood, doAnimate);
				}
			});
		}
	}

	Reveal.initialize({
	    controls: true,
	    embedded: true,
	    history: true,
	    width: 960,
	    height: 1920,
	    dependencies: [
	        { src: 'https://cdnjs.cloudflare.com/ajax/libs/reveal.js/3.0.0/plugin/markdown/marked.js' },
	        { src: 'https://cdnjs.cloudflare.com/ajax/libs/reveal.js/3.0.0/plugin/markdown/markdown.js'}
	    ]
	});

	function handleSlideChange(event) {
		var prevIndex = event.previousSlide && event.previousSlide.getAttribute('data-map');
		var mapIndex = event.currentSlide.getAttribute('data-map');

		var hiliteIndex = event.currentSlide.getAttribute('data-highlight');

		var prevZoom = event.previousSlide && event.previousSlide.hasAttribute('data-zoom');
		var doZoom = event.currentSlide.hasAttribute('data-zoom');

		var prevMarker = event.previousSlide && event.previousSlide.getAttribute('data-map-marker');
		var marker = event.currentSlide.getAttribute('data-map-marker');

		if (mapIndex && mapIndex !== prevIndex || prevZoom !== doZoom) {
			applyView(mapIndex, doZoom && hiliteIndex);
		}
		if (prevMarker && prevMarker !== marker) {
			map.removeLayer(markers[prevMarker]);
		}
		if (marker && mapIndex) {
			markers[marker].addTo(map);
		}
		if (mapIndex) {
			applyHighlight(mapIndex, hiliteIndex, doZoom);
		}
	}
	Reveal.addEventListener('slidechanged', function(e) {
		try {
			var slide = e.currentSlide;
			var title = slide.querySelector && slide.querySelector('h2');
			var titleText = title && title.textContent;
			ga('send', 'pageview', {
	  		// we need to send the hash
				'page': location.pathname + location.search  + location.hash,
				'title': titleText
			});
			document.title = titleText;
		} catch(e) {
			console.log('oops, couldnt send analytics');
		}
		handleSlideChange(e);
	});
	Reveal.addEventListener('ready', function(e) {
		Promise.all(dataFetch).then(function () {
			handleSlideChange(e);
		});
	});

})(L, Reveal);
