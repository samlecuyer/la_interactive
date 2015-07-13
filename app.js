// (function(L, Reveal) {
	// 'use strict';

	// some basic coorditnates
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
		// this starts at city hall
	}).setView(coords['city-hall'], 11);

	L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
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
			case 'unincorporated-area': return 'green';
		}
	}
	var neighborhoods = L.geoJson(undefined, {
		onEachFeature: function(feature, layer) {
			// layer.bindPopup(feature.properties.name);
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
	})//.addTo(map);

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
	})//.addTo(map);

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
	})//.addTo(map);

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
	})//.addTo(map);

	fetch('geojson/la-county-neighborhoods-current.json').then(function(resp) {
		resp.json().then(function(data) {
			neighborhoods.addData(data);
			cities.addData(data);
		});
	});

	/*
	fetch('/geojson/405.json').then(function(resp) {
		resp.json().then(function(data) {
			airports.addData(data);	
		});
	});

	fetch('/geojson/bottlenecks.json').then(function(resp) {
		resp.json().then(function(data) {
			bottlenecks.addData(data);	
		});
	});

	fetch('/geojson/runways.json').then(function(resp) {
		resp.json().then(function(data) {
			airports.addData(data);	
		});
	});

	fetch('/geojson/marina.json').then(function(resp) {
		resp.json().then(function(data) {
			airports.addData(data);	
		});
	});
	*/

	Reveal.initialize({
	    controls: true,
	    embedded: true,
	    width: 960,
	    height: 1920,
	    dependencies: [
	        { src: 'https://cdnjs.cloudflare.com/ajax/libs/reveal.js/3.0.0/plugin/markdown/marked.js' },
	        { src: 'https://cdnjs.cloudflare.com/ajax/libs/reveal.js/3.0.0/plugin/markdown/markdown.js'},
	        { src: 'https://cdnjs.cloudflare.com/ajax/libs/reveal.js/3.0.0/plugin/highlight/highlight.js',
	          async: true, callback: function() { hljs.initHighlightingOnLoad(); }}
	    ]
	});

	Reveal.addEventListener( 'slidechanged', function( event ) {
		console.log(event);
		if (event.indexh == 2) {
			neighborhoods.addTo(map);
			map.fitBounds(neighborhoods);
		}
		if (event.indexh == 3) {
			cities.addTo(map);
			map.fitBounds(cities, {animate: true});
		}
		if (event.indexh == 4) {
			map.fitBounds(coords['bay'], {animate: true});
		}
		if (event.indexh == 5) {
			map.setView(coords['palos-verdes'], 11, {animate: true});
		}
	});

// })(L, Reveal);
