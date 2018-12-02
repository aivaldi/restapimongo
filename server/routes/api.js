const fs = require('fs');
const path = require('path');

function buildRequires(directory, app, apiVersion, uri){

  var items = fs.readdirSync(directory)

  for ( var pos=0;pos<items.length;pos++){
    var itemName = items[pos];
    var item = fs.lstatSync(directory + path.sep +itemName)

    if (itemName=="baseAPISimpleRoute.js")
      continue;
    if (item.isDirectory())
      buildRequires(directory +path.sep+itemName,app,apiVersion,uri+'/'+itemName)
    else{
      var r = require(directory+'/' + itemName)()
      app.use(uri+ '/'+  itemName.substring(0,itemName.length-3) , r);

    }
  }
}


module.exports = function(app, apiVersion){


  /**
   Requires de api
   */
  buildRequires(__dirname+path.sep+ apiVersion, app, apiVersion, '/api/'+apiVersion)

}
