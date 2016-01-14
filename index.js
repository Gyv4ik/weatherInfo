(function($, undefined){

	$.widget('custom.weatherInfo', {
		options: {
			height: 200,
			width: 300,
			city: null
		},
		model: {
			activeState: 'main',
			mainState: {
				condition: null,
				city: null,
				minT: null,
				maxT: null,
				curT: null,
				image: null
			},
			additionalState: {
				city: null
			}
		},

		_init: function() {
			var self = this;
			var height = self.options.height + "px";
			var width = self.options.width + "px";
			var getLocation = $.Deferred(function(deff) {
				navigator.geolocation.getCurrentPosition(function(position) {
					var pos = {
						lat: position.coords.latitude,
						lon: position.coords.longitude
					};
					if (!pos.lat || !pos.lon) deff.reject();
					deff.resolve(pos);
				});
			});

			// self.element.addClass('weather');
			getLocation
				.then(self._getInfo)
				.then(self._parseData.bind(self), function() {alert('Невозможно получить данные с сервера.')})
				.then(self._render.bind(self));

			getLocation.fail([self._changeState.bind(self), self._render.bind(self)]);
			// .then(null, this._changeState.bind(this))
			// .then(null, this._render.bind(this));

			$(this.element).find('.main__city').on('click', null, function() {
				self._changeState();
				self._render();
			});

			$(this.element).find('.additional__go-btn').on('click', null, function() {
					var options = {};

					options.city = $('.additional__city-input').val();
					options.country = 'ukraine';

					self._getInfo(options)
						.then(self._parseData.bind(self), function() {alert('Невозможно получить данные с сервера.')})
						.then(self._changeState.bind(self))
						.then(self._render.bind(self));
				});

			// self._autocomplete();
		},

		_getInfo: function(options) {
			console.log('get was done');
			var url;
			var city = options.city;
			var country = options.country;
			var key = '37bf27aa42b29522';
			var language = 'en';

			if (city) {
				url = 'http://api.wunderground.com/api/'+key+'/geolookup/q/'+language+'/'+city+'.json';
				return $.get(url);
			}

			url = 'http://api.wunderground.com/api/'+key+'/geolookup/q/'+language+'/'+city+'.json';
			return $.get(url, {lat: options.lat, lon: options.lon});
		},

		_parseData: function(data) {
			console.log(data);
			var KELVIN = 273;

			this.model.mainState.curT = parseInt(data.main.temp.toFixed(0)) - KELVIN;
			this.model.mainState.minT = parseInt(data.main['temp_min'].toFixed(0)) - KELVIN;
			this.model.mainState.maxT = parseInt(data.main['temp_max'].toFixed(0)) - KELVIN;
			this.model.mainState.condition = data.weather[0].description;
			this.model.mainState.city = data.name;
			this.model.mainState.image = 'images/'
			// console.log(this.model);
		},

		_render: function() {
			console.log('render');
			if (this.model.activeState == 'main') {
				$('.additional').hide();
				$('.main').css('display', 'table');
				$('.main__condition').text(this.model.mainState.condition);
				$('.main__city').text(this.model.mainState.city);
				$('.main__cur-text').text(this.model.mainState.curT);
				// if (this.model.mainState.minT == this.model.mainState.curT) {
				// 	$('.main__min').hide();
				// 	$('.main__max').hide();
				// 	return;
				// }
				$('.main__min-text').text(this.model.mainState.minT);
				$('.main__max-text').text(this.model.mainState.maxT);
				// $('.main__min').show();
				// $('.main__max').show();
				return;
			}
			$('.main').hide();
			$('.additional').css('display', 'table');
		},

		_changeState: function() {
			console.log('change state');
			var activeState = this.model.activeState;
				if (!activeState || activeState == 'additional') {
					this.model.activeState = 'main';
					return;
				}
			this.model.activeState = 'additional';
		},

		_autocomplete: function() {
			$( ".additional__city-input" ).autocomplete({
				source: function( request, response ) {
					$.ajax({
						url: "http://gd.geobytes.com/AutoCompleteCity",
						dataType: "jsonp",
						data: {
							q: request.term
						},
						success: function( data ) {
							response( data );
						}
					});
				},
				minLength: 3,

				open: function() {
					$( this ).removeClass( "ui-corner-all" ).addClass( "ui-corner-top" );
				},
				close: function() {
					$( this ).removeClass( "ui-corner-top" ).addClass( "ui-corner-all" );
				}
			});
				// function log( message ) {
				// 	$( "<div>" ).text( message ).prependTo( "#log" );
				// 	$( "#log" ).scrollTop( 0 );
				// }
			},

			height: function(value) {
				if (value === undefined) return this.options.height;
				this.options.height = value;
				// console.log(value);
			},

			width: function(value) {
				this.options.width = value;
			}
		});

$('.weather').weatherInfo({height: 200, width: 300});

})(jQuery);
