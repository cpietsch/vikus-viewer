![VIKUS Viewer](https://vikusviewer.fh-potsdam.de/assets/teaser.png)

# VikusViewer

[VIKUS Viewer](https://vikusviewer.fh-potsdam.de/) is a web-based visualization system that arranges thousands of cultural artifacts on a dynamic canvas and supports the exploration of thematic and temporal patterns of large collections, while providing rapid access to high-resolution imagery.

## Documentation

This repo contains the html, css and js of the VIKUS Viewer. To get started you will have to clone this repo and run a webserver. We recommend nginx for production, but any apache server will work too. To minimize the loading time your should make use of gzip compression on js and csv files. Also enable HTTP/2, since Multiplexing will heavily help with loading all those image assets.

### Data

You can customize your copy of VIKUS Viewer in various ways. First you will need to create a data folder which will contain your images and metadata. Have a look at the [data folder](https://github.com/cpietsch/vikus-viewer-data/tree/master/vangogh) of the vangogh collection.

#### [config.json](https://github.com/cpietsch/vikus-viewer-data/blob/master/vangogh/config.json)

This is the first entry point of the VIKUS Viewer. It defines the project name, data urls, columns, styles and the detail sidebar of your collection.

#### [data.csv](https://github.com/cpietsch/vikus-viewer-data/blob/master/vangogh/data.csv)

The data.csv holds the metadata information of the collection. The following fields are mandatory: `imageid`, `keywords`, `year`.
- `imageid` is a unique id which is linked to the name of the corresponding image. (id: 123 -> 123.jpg)
- `keywords` comma seperated list of keywords for the tags on the top
- `year` can be a number or a string, will be sorted ascending
- `_fields` these are custom meta data fields
All of the columns are beeing sticked together to enable the freetext search.

#### [timeline.csv](https://github.com/cpietsch/vikus-viewer-data/blob/master/vangogh/timeline.json)

The timeline.csv holds the information for the timeline displayed underneath the years.
- `year` can be a number or a string, is linked to the data.csv year field
- `titel` the headline of the blurb
- `text` first detail text when zoomed in a little bit
- `extra` additional text when zoomed to the maximum

#### [info.md](https://github.com/cpietsch/vikus-viewer-data/blob/master/vangogh/info.md)

This is the information displayed on the left side when opening the visualization. You can put in any kind of [Markdown](https://marked.js.org/).


## Credits

VIKUS Viewer was designed and developed by Christopher Pietsch. The VIKUS Viewer software is based on the visualization code behind Past Visions, a collaborative effort by Katrin Glinka, Christopher Pietsch, and Marian Dörk carried out at the University of Applied Sciences Potsdam in the context of the Urban Complexity Lab during the research project VIKUS (2014-2017).
