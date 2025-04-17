![VIKUS Viewer](https://vikusviewer.fh-potsdam.de/assets/teaser.png)

# VIKUS Viewer

[VIKUS Viewer](https://vikusviewer.fh-potsdam.de/) is a web-based visualization system that arranges thousands of cultural artifacts on a dynamic canvas and supports the exploration of thematic and temporal patterns of large collections, while providing rapid access to high-resolution imagery.

## Documentation

This repo contains the HTML, CSS and JS of the VIKUS Viewer software. To get started you will have to clone this repo and run a webserver. We recommend nginx for production, but any web server should work. VIKUS Viewer is a static web app that requires no server-side logic ensuring long-term availability. To minimize the loading time your web server should make use of GZIP compression on JS and CSV files. Also enable HTTP/2, since multiplexing significantly helps with loading image assets.

### IIIF
VIKUS Viewer can be used with IIIF Collections through the [vikus-IIIF-generator](https://github.com/cpietsch/vikus-IIIF-generator).

### Metadata

To use the VIKUS Viewer for a custom image collection, you need to prepare metadata files that describe the collection and objects, and configure the visualization. To get started, you first need to create a ```/data``` folder which will contain all metadata and image files. Have a look at the metadata generated for the [Van Gogh collection](https://github.com/cpietsch/vikus-viewer-data/tree/master/vangogh) (Van Gogh Museum) as a reference for the following descriptions.


#### [config.json](https://github.com/cpietsch/vikus-viewer-data/blob/master/vangogh/config.json)

This is the configuration file that defines the project name, data URLs, columns, styles, and what is shown in the detail sidebar of your collection. The URLs don't have to be absolute, but it can be handy if your assets are not hosted on the same server.

The **detail.structure** in config.json defines the structure of the detail view. If there is no data for a field, it will not be displayed.
You can use the following types in combination with the metadata fields from data.csv. defined in `source`:
- `text`: renders simple text
- `markdown`: renders markdown
- `keywords`: renders an array
- `function`: a custom function that can be defined in the `source` field. Example: "column._width + 'mm * ' + column._height + 'mm'"

You can choose `display` to define the display of the field. Possible values are: `column` and `wide`.


#### [data.csv](https://github.com/cpietsch/vikus-viewer-data/blob/master/vangogh/data.csv)

The data.csv holds all the metadata information for each object in the collection. The following fields are mandatory: `id
`, `keywords`, `year`.
- `id` is is linked to the name of the corresponding image. (id: 123 -> 123.jpg)
- `keywords` comma seperated list of keywords for the tags on the top
- `year` can be a number or a string, will be sorted ascending
- `_fields` these are custom metadata fields (note the prefixed underscore)


#### [timeline.csv](https://github.com/cpietsch/vikus-viewer-data/blob/master/vangogh/timeline.csv)

The timeline.csv holds the information for the timeline displayed underneath the years.
- `year` can be a number or a string, is linked to the `year` field in data.csv
- `title` the headline of the blurb
- `text` first detail text when zoomed in a little bit
- `extra` additional text when zoomed to the maximum


#### [info.md](https://github.com/cpietsch/vikus-viewer-data/blob/master/vangogh/info.md)

This is the information displayed on the left side when opening the visualization. You can put in any kind of [Markdown](https://marked.js.org/).


### Images

Apart from the metadata, you need to preprocess the image files, i.e., to generate sprites and textures for the different zoom levels. Please see the  [vikus-viewer-script](https://github.com/cpietsch/vikus-viewer-script) for the details. After running the script you can place the resulting folders into ```/data``` or any other location. Make sure that the texture URLs in the config.json point to these folders.

### Similarity (t-SNE/UMAP)

As an alternative to the temporal view, you can create a t-SNE/UMAP layout based on image similarity. The script in [vikus-viewer-script](https://github.com/cpietsch/vikus-viewer-script) creates a tsne.csv which can be put next to the data.csv in the `/data` folder. Image similarity is calculated via the [imagenet activation logit](https://beta.observablehq.com/@cpietsch/imagenet-activation-logit) and then run through t-SNE. An additional spacing step ensures no overlaying images in the distribution.
You can also create the layout through a Jupyter Notebook in python using CLIP.

### Layouts

You can add layouts or remove the time layout in the [loader.layout](https://github.com/cpietsch/vikus-viewer-data/blob/master/vangogh/config.json#L10) section of the config.json.
Add a custom layout in this format: `{"title": "UMAP", "url": "umap.csv", "scale": 0.8 }` or `{
        "title": "test",
        "type": "group",
        "groupKey": "colum to group on",
        "columns": 4
      },` The scale
parameter is optional and can be used to manually tweak the display depending on your layout and number of images.

## Credits

VIKUS Viewer was designed and developed by Christopher Pietsch. 
The VIKUS Viewer software is based on the visualization code behind [Past Visions](https://github.com/cpietsch/fw4), a collaborative effort by Katrin Glinka, Christopher Pietsch, and Marian Dörk carried out at the University of Applied Sciences Potsdam in the context of the Urban Complexity Lab during the research project VIKUS (2014-2017). Related Paper: [Past Visions and Reconciling Views]( http://www.digitalhumanities.org/dhq/vol/11/2/000290/000290.html). 
The T-SNE view has been implemented for the [Sphaera project](https://sphaera.mpiwg-berlin.mpg.de/) with funding from [Chronoi-REM](https://www.berliner-antike-kolleg.org/rem)

### Libraries
- [pixi.js](https://github.com/pixijs/pixi.js)
- [d3.js](https://github.com/d3/d3)

## License

You may use VIKUS Viewer under the terms of the MIT License. See http://en.wikipedia.org/wiki/MIT_License for more information.
Copyright (C) 2017-2021 Christopher Pietsch, and contributors

## Gallery

- [Swedish Nationalmuseum](https://riksantikvarieambetet.github.io/VIKUS-Viewer-Nationalmuseum/) by [Swedish National Heritage Board](https://www.raa.se/)
- [INEL Project](https://inel.corpora.uni-hamburg.de/vikus_viewer/selkup-1.0/) [[2](https://inel.corpora.uni-hamburg.de/vikus_viewer/dolgan-1.0/), [3](https://inel.corpora.uni-hamburg.de/vikus_viewer/kamas-1.0/)] by [Anne Ferger & Daniel Jettka](https://www.slm.uni-hamburg.de/inel/)
- [WCMA Collection Explorer](http://wcma-explorer.williams.edu/) by [WCMA Digital](https://artmuseum.williams.edu/wcma-digital-project/)
- [Linked Stage Graph - Stuttgart State Theatre from 1912 to 1943](http://slod.fiz-karlsruhe.de/vikus/) by [slod](http://slod.fiz-karlsruhe.de/)
- [New World Nature Exploration Tool](https://vikus.hamilton.edu/cooley/) by [dhinitiative](https://nwn.dhinitiative.org/portfolio-items/seeing-new-world-nature/)
- [Kunst im öffentlichen Raum Pankow](https://vikus.kunst-im-oeffentlichen-raum-pankow.de)
- [Nico and the Navigators](https://archiv.navigators.de)
- [Digitale Safari - FAU Universitätsbibliothek](http://digitale-safari.com/vikus/)
- [Cars, Visual Contagions](https://jdp.visualcontagions.net/vikus/) in [Article by Nicola Carboni, University of Geneva](https://www.unige.ch/visualcontagions/expositions/jeu-de-paume-le-projet/blockbusters/car)
- [The Sphere Tables - MPIWG Berlin](https://sphaera.mpiwg-berlin.mpg.de/vikusTables/)
- [Oil Paintings - Statens Museum for Kunst](https://byabbe.se/smk-vikus-viewer/)
- [imagineRio - Rice University](https://imaginerio.github.io/vikus-viewer/)
- [Museu da Literatura Brasileira](https://museudaliteratura.com.br/)
- [Africa Art Archive Viewer](https://africa-art-archive.ch/archive-viewer)
- [NGA Recent Aquisitions](https://bzweig633.github.io/vikus-nga/)
- [Die Sammlung Emil Bührle](https://cpietsch.github.io/kunsthaus-viewer/)
- [Veros geheime Bibliothek](https://veronika-szuecs.com/vis/)
