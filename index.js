//TODO Пофиксить в additional ввод города. С Харьковом все ок.
//Autocomplete
//For retina
//Сравнить показания погоды openweather forecast

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
				error: null,
				city: null
			}
		}
		var defaults = {
			height: null,
			with: null
		};

		init();

		autocomplete();

		$(self).on('click', null, function(event) {
			var className = event.target.className;

			if(event.target.parentNode.className == 'main__city') {
				changeState();
				render();
			}
			else if(event.target.className == 'autocomplete-suggestion') {
				$('.additional__city-input').focus();
			}
		});

		$('.weather').on('keypress', '.additional', function() {
			var enterKeyCode = '13';

   			if(event.keyCode == enterKeyCode) {
   				city = $('.additional__city-input').val();
   				if (city.length == 0) return;
				model.mainState.city = city;

				getInfo()
					.then(parseData, function() {throw new Error('Сервер не отвечает')})
					.then(function(error) {
						if(!error) changeState();
						pushToStorage();
					})
					.then(render)
					.fail(errorHandler);
       		}
		});

		function init(params) {

			var init;

			// актуальные настройки, будут индивидуальными при каждом запуске
			model.options = $.extend({}, defaults, params);

			var myWeather = localStorage.getItem('myWeather');

			if (myWeather) {
				getFromStorage();
				render();
				return;
			}

			getLocation()
				.then(getInfo, function() {throw new Error('Не удалось определить координаты местоположения'); changeState()})
				.then(parseData, function() {throw new Error('Сервер не отвечает'); render()})
				.then(getInfo, function() {throw new Error('Сервер не отвечает')})
				.then(parseData)
				.then(pushToStorage)
				.then(render)
				.fail(errorHandler);

		// инициализируем один раз
            init = $(self).data('weatherWidget');

            if (!init) {
                $(self).data('weatherWidget', true);
            }
		}

		function getInfoHandler(data) {
			var error = data.response.error;

			if (error) {
				alert(error.description);
				return;
			}
			if (model.activeState == 'additional') {
				alert('К сожалению, сервер не отвечает. Попробуйте позже.');
			}
			return data;
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
			var feature4 = 'hourly';

			if (city) {
				url = 'http://api.wunderground.com/api/'+key+'/'+feature2+'/'+feature3+'/'+feature4+'/'+lang+'/q/'+city+'.'+format;
				return $.get(url);
			}
			url = 'http://api.wunderground.com/api/'+key+'/'+feature1+'/'+lang+'/q/'+model.location.lat+','+model.location.lon+'.'+format
			return $.get(url);
		}

		function parseData(data) {
			console.log(data);
			var error = data.response.error;

			if(error) {
				model.additionalState.error = error.description;
				// throw new Error(error.description);
				return error;
			}
			if(data.location) {
				model.mainState.city = data.location.city;
				return;
			}
			if(data.response.results) {
				throw new Error('Wrong city name');
				return;
			}
			model.mainState.curT = parseInt(data.current_observation.temp_c);
			model.mainState.feel = parseInt(data.current_observation.feelslike_c);
			model.mainState.minT = parseInt(data.forecast.simpleforecast.forecastday[0].low.celsius);
			model.mainState.maxT = parseInt(data.forecast.simpleforecast.forecastday[0].high.celsius);
			model.mainState.condition = data.current_observation.weather;
			model.mainState.image = data.current_observation.icon_url;
			model.mainState.city = data.current_observation.display_location.city;
			console.log(model.mainState.city);
		}

		function render() {
			console.log('render');
			var error = model.additionalState.error;

			if (model.activeState == 'main') {
				$('.additional__city-input').val('');
				$('.additional__error-mes').text('');
				$('.additional').hide();
				$('.main').css('display', 'table');
				$('.main__image').attr('src', model.mainState.image);
				$('.main__condition').text(model.mainState.condition);
				$('.main__city-text').text(model.mainState.city);
				$('.main__cur-text').text(model.mainState.curT);
				$('.main__feel-text').text(model.mainState.feel);
				$('.main__min-text').text(model.mainState.minT);
				$('.main__max-text').text(model.mainState.maxT);
				return;
			}
			$('.main').hide();
			$('.additional').css('display', 'table');
			if (error) {
				$('.additional__error-mes').text(error);
				model.additionalState.error = '';
			}
		}

		function changeState(stateName) {
			console.log('change state');
			var activeState;

			if (stateName) {
				model.activeState = stateName;
				return;
			}
			activeState = model.activeState;
			if (!activeState || activeState == 'additional') {
				model.activeState = 'main';
				console.log(model.activeState);
				return;
			}
			model.activeState = 'additional';
			console.log(model.activeState);
		}

		function pushToStorage() {
			localStorage.setItem('myWeather', JSON.stringify(model));
		}

		function getFromStorage() {
			model = JSON.parse(localStorage.getItem('myWeather'));
		}

		function errorHandler(error) {
			console.log(error);
		}

		// function autocomplete(query) {
		// 	var url = "http://autocomplete.wunderground.com/aq?cb=?";

		// 	$.ajax(url, {
		// 		type: 'GET',
		// 		dataType: 'jsonp',
		// 		data: {
		// 			query: query
		// 		}
		// 	})
		// 	.success(function(data) {
		// 		$('.additional__autocomplete-suggestion').text(data['RESULTS'][0].name);
		// 	});
		// }

	function autocomplete() {
		$('.additional__city-input').autocomplete({
			serviceUrl: "http://autocomplete.wunderground.com/aq?cb=?",
			dataType: 'jsonp',
			paramName: 'query',
			data: {
				query: 'k'
			},
			transformResult: function(data) {
				console.log(data);
				return { suggestions: data['RESULTS'].filter(function(item) {return item.type == 'city';}).map(function(item) {
					return item.name;
				})};
			},
			onSelect: function(suggestion) {

			}
		});
	}
};
    $('.weather').weatherWidget();

})(jQuery);


