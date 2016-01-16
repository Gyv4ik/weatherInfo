//TODO Пофиксить в additional ввод города. С Харьковом все ок.
//Autocomplete
//For retina

(function($, undefined) {

	$.fn.weatherWidget = function() {

		var self = this;

		var model = {
			options: null,
			location: {},
			activeState: 'main',
			mainState: {
				condition: null,
				city: null,
				minT: null,
				maxT: null,
				curT: null,
				feel: null,
				image: null
			},
			additionalState: {
				city: null
			}
		}
		var defaults = {
			height: null,
			with: null
		};

		init();

		function init(params) {

			// актуальные настройки, будут индивидуальными при каждом запуске
			model.options = $.extend({}, defaults, params);

			getLocation()
				.then(getInfo)
				.then(parseData, function() {alert('Невозможно получить данные с сервера.')})
				.then(getInfo)
				.then(parseData, function() {alert('Невозможно получить данные с сервера.')})
				.then(render);

			getLocation().fail([changeState, render]);
				// .then(null, this._changeState.bind(this))
				// .then(null, this._render.bind(this));

			$(self).find('.main__city').on('click', null, function() {
				changeState();
				render();
			});

			$(self).find('.additional__go-btn').on('click', null, function() {
				city = $('.additional__city-input').val();
				model.mainState.city = city;

				getInfo()
				.then(parseData, function() {alert('Невозможно получить данные с сервера.')})
				.fail(function(e) {console.log('error');})
				.then(changeState)
				.then(render);
			});

		// инициализируем один раз
            var init = $(self).data('weatherWidget');

            if (!init) {
                $(self).data('weatherWidget', true);
            }

            // return this;
		}

        function getLocation() {
			return $.Deferred(function(deff) {
				navigator.geolocation.getCurrentPosition(function(position) {
					model.location.lat =  position.coords.latitude;
					model.location.lon = position.coords.longitude;
					console.log(model.location);
					if (!model.location.lat || !model.location.lon) deff.reject();
					deff.resolve();
				});
			});
		}

		function getInfo() {
			console.log('get was done');
			var url;
			var city = model.mainState.city;
			var key = '37bf27aa42b29522';
			var lang = 'lang:EN';
			var format = 'json';
			var feature1 = 'geolookup';
			var feature2 = 'conditions';
			var feature3 = 'forecast';

			if (city) {
				url = 'http://api.wunderground.com/api/'+key+'/'+feature3+'/'+feature2+'/'+lang+'/q/'+city+'.'+format;
				return $.get(url);
			}
			// url = 'http://api.wunderground.com/api/'+key+'/'+feature1+'/q/'+model.location.lat+','+model.location.lon+'.'+format;
			url = 'http://api.wunderground.com/api/'+key+'/'+feature1+'/'+lang+'/q/'+model.location.lat+','+model.location.lon+'.'+format
			return $.get(url);
		}

		function parseData(data) {
			console.log(data);
			if(data.location) {
				model.mainState.city = data.location.city;
				return
			}
			if(data.response.results) {
				return new Error('Wrong city name');
			}
			model.mainState.curT = parseInt(data.current_observation.temp_c);
			model.mainState.feel = parseInt(data.current_observation.feelslike_c);
			model.mainState.minT = parseInt(data.forecast.simpleforecast.forecastday[0].low.celsius);
			model.mainState.maxT = parseInt(data.forecast.simpleforecast.forecastday[0].high.celsius);
			model.mainState.condition = data.current_observation.weather;
			model.mainState.image = data.current_observation.icon_url;
			// console.log(this.model);
		}

		function render() {
			console.log('render');
			if (model.activeState == 'main') {
				$('.additional').hide();
				$('.main').css('display', 'table');
				$('.main__image').attr('src', model.mainState.image);
				$('.main__condition').text(model.mainState.condition);
				$('.main__city').text(model.mainState.city);
				$('.main__cur-text').text(model.mainState.curT);
				$('.main__feel-text').text(model.mainState.feel);
				$('.main__min-text').text(model.mainState.minT);
				$('.main__max-text').text(model.mainState.maxT);
				return;
			}
			$('.main').hide();
			$('.additional').css('display', 'table');
		}

		function changeState() {
			console.log('change state');
			var activeState = model.activeState;
			if (!activeState || activeState == 'additional') {
				model.activeState = 'main';
				return;
			}
			model.activeState = 'additional';
		}

    };
    $('.weather').weatherWidget();

})(jQuery);


