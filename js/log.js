// christopher pietsch
// cpietsch@gmail.com
// tweet me @chrispiecom
// 2015-2016

function Logger() {

    function self() {}

    var _buffer = [];
    var _view = "";
    var _startTime = new Date() * 1;
    var _maxBufferSize = 100;

    self.register = function(view) {
        _view = view;
        return self;
    }

    self.log = function(obj) {
        obj.view = _view;
        obj.time = new Date() * 1;
        obj.location = document.location.href;

        _buffer.push(obj);
        // console.warn("logger",obj);

        if (_buffer.length > _maxBufferSize) {
            self.sync();
        }
        return self;
    }

    self.sync = function() {
        // console.warn("uploading");

        // var upload = JSON.stringify(_buffer);
        // _buffer = [];
        // d3.json("https://uclab.fh-potsdam.de/fw4/log.php")
        //     // .header("Content-Type", "application/json")
        //     .post(upload, function(error, data) {
        //         console.warn("done uploading")
        //     });
    }

    self.buffer = function() {

        console.warn("logger", _buffer);

        return self;
    }

    return self;
}
