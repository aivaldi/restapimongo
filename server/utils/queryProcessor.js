var mongoose =  require('mongoose');
var moment = require('moment')
module.exports = {


	buildQuery:function(query, schema){
		var q = []
		var qAnd = []

		Object.keys(query).forEach(
			function (key) {
				if (key=='_page' || key=='_pageSize' || key=='_order')
					return;
				var r = {}
				if (key.substr(key.length - 3, 3) === "_id") {
					key = key.substr(0, key.length - 3)
					r[key] = mongoose.Types.ObjectId(query[key + "_id"].toString())
					qAnd.push(r)
				} else {

				  /*var aux = module.exports.extractSubSchema(key,schema);
				  key = aux.key;
          schema = aux.schema;*/


					if (query[key] != '' && schema.paths[key]) {
					  switch (schema.paths[key].instance){
              case 'Date' :
                v ={
                    '$gte': moment(query[key]).toDate(),
                      '$lt': moment(query[key]).add(1,'day').toDate()
                  }

                r[key] = v
                q.push(r)
                console.log(query[key])
                console.log(q)
                console.log(r)
                break;
              case  'Number':
                if (!isNaN(query[key])) {
                  r[key] = query[key]
                  q.push(r)
                }
                break;
              default:
                r[key] = new RegExp(query[key].replace(' ', '.*'), 'i')
                q.push(r)
            }

					}else {
              r[key] = new RegExp(query[key].replace(' ', '.*'), 'i')
              q.push(r)
					}
				}
			}
		)

		var ret = {}
		if (qAnd.length > 0) {
			if (q.length > 0)
				qAnd.push({$or: q})
			ret = {'$and': qAnd}
		}
		else if (q.length > 0)
			ret = {$or: q}

		return ret;
	},
  extractSubSchema:function (key, schema) {
    var subSchema = schema;
    var newKey = key;
    if (!subSchema.paths[key]) {
      //console.log("inside key: "+key+" subSchema.paths[key] "+ subSchema.paths[key]);
      var res = key.split(".");
      var i = 0;
      if(res[0].length != 0) {
        for (; i < (res.length - 1); i++) {
          if (subSchema.paths[res[i]] && subSchema.paths[res[i]].schema) {
            subSchema = subSchema.paths[res[i]].schema;
          } else {
            break;
          }
        }
        newKey = "";
        for (++i; i < res.length; i++) {
          if (newKey) {
            newKey = newKey + "." + res[i];
          } else {
            newKey = res[i];
          }
        }
      }
    }
    var returnObject = new Object();
    returnObject.schema = subSchema;
    returnObject.key = newKey;
    return returnObject;
  }


}
