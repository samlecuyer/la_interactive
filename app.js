(function(L, Reveal) {
	'use strict';

	// some basic coordinates
	var coords = {
		'channel-islands': [
			{"lat":32.61161640317033,"lng":-120.49255371093749},
			{"lat":34.37064492478658,"lng":-118.0645751953125}
		],
		'city-hall': [34.0536, -118.243],
		'hollywood-sign': [34.134103, -118.321694],
		'point-dume': [34.000872, -118.806839],
		'palos-verdes': [33.758647, -118.345844]
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

	function colorOfPlace(kind) {
		switch (kind) {
			case 'segment-of-a-city': return 'DodgerBlue';
			case 'standalone-city': return 'red';
			case 'unincorporated-area': return 'LightGreen';
		}
	}
	var neighborhoods = L.geoJson(undefined, {
		onEachFeature: function(feature, layer) {
			layer.on({
				click: zoomToFeature
			});
		},
		filter: function(feature, layer) {
			return feature.properties.metadata.type === 'segment-of-a-city';
		},
		style: function(feature) {
			return { 
				weight: 1,
				color: colorOfPlace(feature.properties.metadata.type)
			};
		}
	});

	var unincorporated = L.geoJson(undefined, {
		onEachFeature: function(feature, layer) {
			layer.on({
				click: zoomToFeature
			});
		},
		filter: function(feature, layer) {
			return feature.properties.metadata.type === 'unincorporated-area';
		},
		style: function(feature) {
			return { 
				weight: 1,
				color: 'LightGreen'
			};
		}
	});

	var cities = L.geoJson(undefined, {
		onEachFeature: function(feature, layer) {
			layer.bindPopup(feature.properties.name);
		},
		filter: function(feature, layer) {
			return feature.properties.metadata.type === 'standalone-city';
		},
		style: function(feature) {
			return { 
				weight: 1,
				color: 'LightSkyBlue'
			};
		}
	});

	fetch('geojson/la-county-neighborhoods-current.json').then(function(resp) {
		resp.json().then(function(data) {
			neighborhoods.addData(data);
			unincorporated.addData(data);
			cities.addData(data);
		});
	});

	var info = L.control();

	info.onAdd = function (map) {
	    this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
	    this.update();
	    return this._div;
	};

	// method that we will use to update the control based on feature properties passed
	info.update = function (props) {
	    this._div.innerHTML = '<h4>US Population Density</h4>' +  (props ?
	        '<b>' + props.name + '</b><br />' + props.density + ' people / mi<sup>2</sup>'
	        : 'Hover over a state');
	};

	var regions = L.geoJson(undefined, {
		onEachFeature: function(feature, layer) {
			// layer.bindPopup(feature.properties.name);
		},
		style: function(feature) {
			return { 
				weight: 1,
				color: 'orange'
			};
		}
	});

	fetch('geojson/la-county-regions.json').then(function(resp) {
		resp.json().then(function(data) {
			regions.addData(data);
		});
	});

	var airports = L.geoJson(undefined, {
		onEachFeature: function(feature, layer) {
			layer.bindPopup(feature.properties.name);
		},
		style: function(feature) {
			return { 
				weight: 1,
				color: 'orange'
			};
		}
	});

	var bottlenecks = L.geoJson(undefined, {
		onEachFeature: function(feature, layer) {
			var props = feature.properties;
			var label = props.Freeway;
			layer.bindPopup(label);
		},
		style: function(feature) {
	        return {
	            color: 'red',
			    weight: (feature.properties.Avg_Delay / 2900) * 5
	        };
		}
	});

	var mapViews = {
		'initial': {
			layers: [],
			call: 'setView',
			callArgs: [coords['city-hall'], 11]
		},
		'neighborhoods': {
			layers: [neighborhoods],
			call: 'fitBounds',
			callArgs: [neighborhoods, {animate: true}]
		},
		'neighborhoods+cities': {
			layers: [neighborhoods, cities, unincorporated],
			call: 'fitBounds',
			callArgs: [cities, {animate: true}]
		},
		'regions': {
			layers: [regions],
			call: 'fitBounds',
			callArgs: [regions, {animate: true}]
		},
		'south-bay': {
			layers: [regions],
			call: 'fitBounds',
			//callArgs: [_.find(regions._layers, _.matchesProperty('feature.properties.Name', 'South Bay')), {animate: true}]
		},
	}

	function applyView(viewIndex) {
		var view = mapViews[viewIndex];
		var cObj = coords[viewIndex]
		if (!view && cObj) {
			if (typeof cObj[0] === 'number') {
				map.setView(coords[viewIndex], 12, {animate: true});
			} else {
				map.fitBounds(coords[viewIndex], {animate: true});
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
		if (view.call) {
			map[view.call].apply(map, view.callArgs);
		}
	}

	Reveal.initialize({
	    controls: true,
	    embedded: true,
	    width: 960,
	    height: 1920,
	    dependencies: [
	        { src: 'https://cdnjs.cloudflare.com/ajax/libs/reveal.js/3.0.0/plugin/markdown/marked.js' },
	        { src: 'https://cdnjs.cloudflare.com/ajax/libs/reveal.js/3.0.0/plugin/markdown/markdown.js'}
	    ]
	});

	Reveal.addEventListener( 'slidechanged', function( event ) {
		var prevIndex = event.previousSlide.getAttribute('data-map');
		var mapIndex = event.currentSlide.getAttribute('data-map');
		if (mapIndex && mapIndex !== prevIndex) {
			applyView(mapIndex);
		}
	});

})(L, Reveal);
