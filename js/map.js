var accessToken = '';


function Mapbox() {

	var state = {
		open: false
	}

	var map;
	var initialZoom;
	var initialCenter;
	
	function mapbox() { }

	mapbox.init = function(data){

		data.forEach(d => {
			d.lat = Number(d._Lat)
			d.lng = Number(d._Lon)
		})

		var validData = data.filter(d => !isNaN(d.lat) && !isNaN(d.lng))

		var extent = [
			d3.extent(validData, function(d){ return d.lng; })
			,d3.extent(validData, function(d){ return d.lat; })
		]

		var bounds = [[extent[1][0], extent[0][0]], [extent[1][1], extent[0][1]]]
		console.log(bounds)

		map = L.map('map', {zoomSnap:0}).fitBounds(bounds)

		L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
		    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
		    maxZoom: 18,
		    id: 'mapbox/streets-v11',
		    tileSize: 512,
		    zoomOffset: -1,
		    accessToken: accessToken
		}).addTo(map);

		window.leaflet = map


		map.whenReady(_ => {
			var projected = validData.map(d => {
				var point = map.latLngToContainerPoint([d.lat, d.lng])
				console.log(point)
				return {
					id: d.id,
					x: point.x,
					y: point.y
				}
			})

			canvas.addMapData(projected)
			canvas.projectMap()
			canvas.wakeup()

			initialZoom = map.getZoom()
		})


		
		// initialCenter = map.getCenter()

		

		// map.on('load', function() {
		// 	canvas.addMapData(projected)
		// 	canvas.projectMap()
		// 	canvas.wakeup()

		// })
	}

	mapbox.zoom = function(center, scale, translate, scale1){
		if(!map) return

		var height = canvas.height()

		var y = (height + translate[1]) * -1
		var x = translate[0]
		y = translate[1]

		// map.panBy([x,y], { animate: false })
		if(center){
			var c = [center.lat, center.lng]
			map.setZoomAround(c, initialZoom - (1-scale))
		}
		

		console.log(scale, translate, x, y)

	}

	return mapbox;
}