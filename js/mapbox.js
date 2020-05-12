mapboxgl.accessToken = '';


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

		var bounds = [[extent[0][0], extent[1][0]], [extent[0][1], extent[1][1]]]
		console.log(bounds, bounds)

		map = new mapboxgl.Map({
			container: 'map',
			style: 'mapbox://styles/mapbox/streets-v11',
			bounds: bounds,
			//fitBoundsOptions: { padding: 200 },
			// causes pan & zoom handlers not to be applied, similar to
			// .dragging.disable() and other handler .disable() funtions in Leaflet.
			interactive: false
		});

		

		window.mapbox = map

		initialZoom = map.getZoom()
		initialCenter = map.getCenter()

		

		map.on('load', function() {

			var projected = validData.map(d => {
				var point = map.project([d.lng, d.lat])
				return {
					id: d.id,
					x: point.x,
					y: point.y- canvas.height()
				}
			})

			canvas.addMapData(projected)
			canvas.projectMap()
			canvas.wakeup()

		})
	}

	mapbox.zoom = function(center, scale, translate, scale1){
		if(!map) return
		var height = canvas.height()
		console.log(scale, translate, scale1)
		//map.setZoom(initialZoom + scale)

		var y = (height + translate[1]) * -1
		var x = translate[0]

		map.panTo(initialCenter, {offset: translate, animate:false})
		map.setZoom(initialZoom - (1-Math.sqrt(scale)))
		// if(center){
		// 	var c = [center.lng, center.lat]
		// 	//map.setCenter(c)
		// 	//console.log(c)
		// 	map.flyTo({
		// 		around: c,
		// 		zoom: initialZoom + Math.sqrt(scale),
		// 		duration: 0
		// 	})
		// }

	}

	return mapbox;
}