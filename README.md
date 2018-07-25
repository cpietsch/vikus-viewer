![VIKUS Viewer](https://vikusviewer.fh-potsdam.de/assets/teaser.png)

# VikusViewer

[VIKUS Viewer](https://vikusviewer.fh-potsdam.de/) is a web-based visualization system that arranges thousands of cultural artifacts on a dynamic canvas and supports the exploration of thematic and temporal patterns of large collections, while providing rapid access to high-resolution imagery.

## Documentation

This repo contains the html, css and js of the VIKUS Viewer. To get started you will have to clone this repo and run a webserver. We recommend nginx for production, but any apache server will work too. To minimize the loading time your should make use of gzip compression on js and csv files. Also enable HTTP/2, since Multiplexing will heavily help with loading all those image assets.

### Data

You can customize your copy of VIKUS Viewer in various ways. First you will need to create a data folder which will contain your images and metadata. Have a look at the [data folder](https://github.com/cpietsch/vikus-viewer-data/tree/master/vangogh) of the vangogh collection.

#### [config.json](https://github.com/cpietsch/vikus-viewer-data/blob/master/vangogh/config.json)

This is the first entry point of the VIKUS Viewer. It defines the project name, data urls, columns, styles and the detail sidebar of your collection.

#### [data.csv](https://github.com/cpietsch/vikus-viewer-data/blob/master/vangogh/data.json)

#### [timeline.csv](https://github.com/cpietsch/vikus-viewer-data/blob/master/vangogh/timeline.json)

#### [info.md](https://github.com/cpietsch/vikus-viewer-data/blob/master/vangogh/info.md)


## Credits

VIKUS Viewer was designed and developed by Christopher Pietsch. The VIKUS Viewer software is based on the visualization code behind Past Visions, a collaborative effort by Katrin Glinka, Christopher Pietsch, and Marian Dörk carried out at the University of Applied Sciences Potsdam in the context of the Urban Complexity Lab during the research project VIKUS (2014-2017).
