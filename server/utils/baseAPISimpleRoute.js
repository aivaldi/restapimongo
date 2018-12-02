var passport = require('passport');

var logger = require('../../logger')(module);

var audit = require('./audit.js')
var QueryProcessor = require('./queryProcessor')

module.exports = function (router, urlBase, model, options) {
	if (!options)
		options={}

	router.get(urlBase,passport.authenticate('jwt', {session: false}), function (req, res, next) {

		var query = QueryProcessor.buildQuery(req.query, model.schema)
    console.log(query);
		var modelToFind = model.find(query);
		if (options.hasPopulate)
		{
			modelToFind = options.populate(modelToFind)
		}


		var _pageNumber = (req.query._page)?Number(req.query._page):0,
			_pageSize = (req.query._pageSize)?Number(req.query._pageSize):0,
			_sort = (req.query._order)?req.query._order:''

		model.count(query,function(err,count){


			var q = modelToFind;
			//si no hay tama;o de pagina entonces quiere decir que no hago el paginado
			if (_pageSize>0)
        q = q.skip(_pageNumber > 0 ? ((_pageNumber - 1) * _pageSize) : 0).limit(_pageSize)

      q.sort(_sort).exec(function(err, docs) {
				if (err)
					res.json(err);
				else
					res.json({
						"Result":"Ok",
						"TotalCount": count,
						"TotalPage": docs.length,
						"_Array": docs
					});
			});
		});
	});

	/** GET  by id **/
	router.get(urlBase + '/:id', passport.authenticate('jwt', {session: false}), function (req, res, next) {

		model.findOne({_id: req.params.id}).exec().then(
			function (ok) {
				res.send(ok);
			},
			function (error) {
				next(error);
			}
		).then(null, function(error) { next(error.stack) });

	});


	/** new */
	router.post(urlBase, passport.authenticate('jwt', {session: false}), function (req, res, next) {


		req.body['audit'] = audit.newAudit(req.user.login)
		var m = new model(
			req.body

    )
    console.log("modelo")
    console.log(m);
		m.save(function (err, small)
      {
        if (err) {
          logger.error(err);
          res.status(500).send(err);
          next(err)
        }
        res.send(small);
        next();
		  }
		)

	});

	/** update */
	router.post(urlBase + '/:id', passport.authenticate('jwt', {session: false}), function (req, res, next) {
		var m = req.body;
    var ObjectId = require('mongoose').Types.ObjectId;
		console.log(req.params.id)
		delete m['_id']
		model.findByIdAndUpdate(req.params.id, {$set: m}, {new: true}, function (err, small) {
			if (err) {
				console.log(err);
				res.status(500).send(err);
				return;
			}
			if (small == null) {

				console.log("update record not found on " + urlBase);
				res.status(500).send("No se encontro el registro solicitado " + urlBase);
				return;
			}
      small['audit'] = audit.updateAudit(m.audit, req.user.login)

      res.send(small);
      next()
		})

	});

	/** delete */
	router.delete(urlBase + '/:id', passport.authenticate('jwt', {session: false}), function (req, res, next) {

		model.remove({_id: req.params.id}, function (err, small) {
			if (err) {
				console.log(err);
				res.status(500).send(err);
				return;
			}
			res.send(small);
		})
	});

	return router;
}
