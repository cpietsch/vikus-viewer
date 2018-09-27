![VIKUS Viewer](https://vikusviewer.fh-potsdam.de/assets/teaser.png)

# VIKUS Viewer

[VIKUS Viewer](https://vikusviewer.fh-potsdam.de/) is a web-based visualization system that arranges thousands of cultural artifacts on a dynamic canvas and supports the exploration of thematic and temporal patterns of large collections, while providing rapid access to high-resolution imagery.

## Documentation

This repo contains the HTML, CSS and JS of the VIKUS Viewer software. To get started you will have to clone this repo and run a webserver. We recommend nginx for production, but any web server will work too. There is no server-side logic necessary. To minimize the loading time your should make use of GZIP compression on JS and CSV files. Also enable HTTP/2, since Multiplexing will heavily help with loading all those image assets.

### Metadata

To use the VIKUS Viewer for a custom image collection, you need to prepare metadata files that describe the collection and objects, and configure the visualization. To get started, you first need to create a ```data``` folder which will contain all metadata and image files. Have a look at the metadata generated for the [Van Gogh collection](https://github.com/cpietsch/vikus-viewer-data/tree/master/vangogh) (Van Gogh Museum) as a reference for the following descriptions.

#### [config.json](https://github.com/cpietsch/vikus-viewer-data/blob/master/vangogh/config.json)

This is the configuration file that defines the project name, data URLs, columns, styles, and what is shown in the detail sidebar of your collection.

#### [data.csv](https://github.com/cpietsch/vikus-viewer-data/blob/master/vangogh/data.csv)

The data.csv holds all the metadata information for each object in the collection. The following fields are mandatory: `id
`, `keywords`, `year`.
- `id` is is linked to the name of the corresponding image. (id: 123 -> 123.jpg)
- `keywords` comma seperated list of keywords for the tags on the top
- `year` can be a number or a string, will be sorted ascending
- `_fields` these are custom metadata fields (note the prefixed underscore)

All of the columns are beeing sticked together to enable the freetext search.

#### [timeline.csv](https://github.com/cpietsch/vikus-viewer-data/blob/master/vangogh/timeline.json)

The timeline.csv holds the information for the timeline displayed underneath the years.
- `year` can be a number or a string, is linked to the `year` field in data.csv
- `title` the headline of the blurb
- `text` first detail text when zoomed in a little bit
- `extra` additional text when zoomed to the maximum

#### [info.md](https://github.com/cpietsch/vikus-viewer-data/blob/master/vangogh/info.md)

This is the information displayed on the left side when opening the visualization. You can put in any kind of [Markdown](https://marked.js.org/).


## Images

Apart from the metadata, you need to preprocess the image files, i.e., to generate sprites and textures for the different zoom levels. Please see the  [vikus-viewer-script](https://github.com/cpietsch/vikus-viewer-script) for the details.


## Credits

VIKUS Viewer was designed and developed by Christopher Pietsch. The VIKUS Viewer software is based on the visualization code behind Past Visions, a collaborative effort by Katrin Glinka, Christopher Pietsch, and Marian Dörk carried out at the University of Applied Sciences Potsdam in the context of the Urban Complexity Lab during the research project VIKUS (2014-2017).

## License

You may use VIKUS Viewer under the terms of the MIT License. See http://en.wikipedia.org/wiki/MIT_License for more information.


Copyright (C) 2018 Christopher Pietsch, and contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
