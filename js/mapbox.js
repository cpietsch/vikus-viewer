mapboxgl.accessToken = ''

function Mapbox() {
  var state = {
    open: false,
  }

  var map
  var initialZoom
  var initialCenter
  var projected
  var validData
  var bounds
  function mapbox() {}

  mapbox.init = function (data) {
    data.forEach((d) => {
      d.lat = Number(d._Lat)
      d.lng = Number(d._Lon)
    })

    validData = data.filter((d) => !isNaN(d.lat) && !isNaN(d.lng))

    var extent = [
      d3.extent(validData, function (d) {
        return d.lng
      }),
      d3.extent(validData, function (d) {
        return d.lat
      }),
    ]

    bounds = [
      [extent[0][0], extent[1][0]],
      [extent[0][1], extent[1][1]],
    ]
    console.log(bounds, bounds)

    map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/streets-v11',
      bounds: bounds,
      fitBoundsOptions: { padding: 100 },
      // causes pan & zoom handlers not to be applied, similar to
      // .dragging.disable() and other handler .disable() funtions in Leaflet.
      interactive: false,
    })

    window.mapbox = map

    map.on('load', function () {
      console.log('load')
      mapbox.project()
    })
    // map.on('resize', function () {
    //   mapbox.project()
    // })
  }

  mapbox.project = function () {
    console.log('projekt')
    map.fitBounds(bounds, { padding: 100, linaer: true, animate: false })

    var projected = validData.map((d) => {
      var point = map.project([d.lng, d.lat])
      return {
        id: d.id,
        x: point.x,
        y: point.y,
      }
    })

    initialZoom = map.getZoom()
    initialCenter = map.getCenter()
    initialCenterPos = map.project(initialCenter)

    canvas.setMapData(projected)
    // canvas.projectMap()
    // canvas.wakeup()
  }

  mapbox.zoom = function (center, mousePos, scale, translate, imageSize) {
    if (!map) return
    // console.log('zoom')

    // console.log(map.getZoom(), scale)
    // console.log(Math.log(scale))

    if (initialCenter) {
      var x0 = translate[0] + (canvas.width() * scale - canvas.width()) / 2
      var y0 = translate[1] + (canvas.height() * scale - canvas.height()) / 2

      // console.log(translate, y0)
      // console.log(canvas.width() / 2, canvas.height() / 2)

      var x = canvas.width() / 2 + x0
      var y = canvas.height() / 2 + y0

      var zoom = initialZoom + Math.log(scale) / Math.LN2

      map.setZoom(zoom)
      map.transform.setLocationAtPoint(initialCenter, new mapboxgl.Point(x, y))
    }

    if (center) {
      // var centerCoord = { lng: center.lng, lat: center.lat }
      // var centerPos = [center.x, center.y]
      // var projected = map.project(centerCoord)
      // // console.log(centerCoord, center, projected, mousePos, centerPos)
      // var x0 = translate[0] + (canvas.width() * scale - canvas.width()) / 2
      // var y0 = translate[1] + (canvas.height() * scale - canvas.height()) / 2
      // console.log(translate, y0)
      // var x = center.x + x0
      // var y = center.y + canvas.height() + y0
      // var zoom = zoomScale(scale)
      // // console.log('zooom', zoom, scale)
      // //map.panTo(initialCenter, { offset: translate, animate: false })
      // map.transform.setLocationAtPoint(centerCoord, new mapboxgl.Point(x, y))
      // map.setZoom(zoom)
      // ---
      // console.log(map.getCenter())
      //initialCenter = centerCoord
      //map.setCenter(c)
      //console.log(c)
      // map.flyTo({
      //   around: c,
      //   zoom: initialZoom - (1 - Math.sqrt(scale)),
      //   duration: 0,
      // })
    }
    // } else {

    //   map.panTo(initialCenter, { offset: scaledTranslate, animate: false })
    //   console.log(map.getCenter())
    //   console.log(translate)
    //   //initialCenter = map.getCenter()
    // }

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

  return mapbox
}
