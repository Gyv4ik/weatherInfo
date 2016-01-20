(function($, undefined) {

	$.fn.weatherWidget = function(params) {

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
				feelT: null,
				image: null
			},
			additionalState: {
				error: null,
				city: null
			}
		}
		var defaults = {
			height: 150,
			with: 300,
		};

		init();

		self.on('click', null, function(event) {
			var className = event.target.className;

			if(event.target.parentNode.className == 'main__city') {
				changeState();
				render();
			}
			else if(event.target.className == 'autocomplete-suggestion') {
				self.find('.additional__city-input').focus();
			}
		});

		function init() {

			var init;

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
			init = self.data('weatherWidget');

			if (!init) {
				self.data('weatherWidget', true);
			}

			return this;
		}

		function getLocation() {
			return $.Deferred(function(deff) {
				navigator.geolocation.getCurrentPosition(function(position) {
					var location = model.location;

					location.lat =  position.coords.latitude;
					location.lon = position.coords.longitude;
					console.log(location);
					if (!location.lat || !location.lon) deff.reject();
					deff.resolve();
				});
			});
		}

		function getInfo() {
			console.log('GET');
			var weather = {
				href: 'http://api.wunderground.com/api',
				key: '37bf27aa42b29522',
				lang: 'lang:EN',
				format: 'json',
				feature1: 'geolookup',
				feature2: 'conditions',
				feature3: 'forecast',
				queryParam: 'q',
				query: model.mainState.city
			}
			if (weather.query) {
				url = [weather.href, weather.key, weather.feature2, weather.feature3, weather.lang, weather.queryParam, weather.query].join('/')+'.'+weather.format;
			}
			else {
				url = [weather.href, weather.key, weather.feature1, weather.queryParam, model.location.lat].join('/')+','+model.location.lon+'.'+weather.format;
			}
			return $.get(url);
		}

		function parseData(data) {
			var mainState = model.mainState;
			var curObs = data.current_observation;

			console.log(data);
			var error = data.response.error;

			if(error) {
				model.additionalState.error = error.description;
				return error;
			}
			if(data.location) {
				mainState.city = data.location.city;
				return;
			}
			if(data.response.results) {
				throw new Error('Wrong city name');
				return;
			}
			mainState.curT = parseInt(curObs.temp_c);
			mainState.feelT = parseInt(curObs.feelslike_c);
			mainState.minT = parseInt(data.forecast.simpleforecast.forecastday[0].low.celsius);
			mainState.maxT = parseInt(data.forecast.simpleforecast.forecastday[0].high.celsius);
			mainState.condition = curObs.weather;
			mainState.image = curObs.icon_url;
			mainState.city = curObs.display_location.city;
			console.log(mainState.city);
		}

		function render() {
			console.log('render');
			var mainState = model.mainState;
			var error = model.additionalState.error;
			var templateSettings = {};
			var mainStateTmpl = _.template(
				`<div class="main">
					<div class="main__content">
						<div class="main__row">
							<div class="main__col">
								<div class="main__left">
									<div class="main__cur">
										<span class="main__cur-text"><%= curT %></span>°
									</div>
									<div class="main__condition"><%= condition %></div>
								</div>
								<div class="main__right">
									<div class="main__min">
										min: <span class="main__min-text"><%= minT %></span>°
									</div>
									<div class="main__max">
										max: <span class="main__max-text"><%= maxT %></span><span>°</span>
									</div>
									<div class="main__feel">
										feel: <span class="main__feel-text"><%= feelT %></span><span>°</span>
									</div>
								</div>
							</div>
							<div class="main__col">
								<div class="main__image-cont">
									<img class="main__image" src="<%= image %>" alt="condition image">
							</div>
						</div>
					</div>
					<div class="main__row clearfix">
						<div class="main__city"><i class="material-icons">room</i><span class="main__city-text"><%= city %></span></div>
					</div>
				</div>
			</div>`);

			var additionStateTmpl = _.template(
				`<div class="additional">
					<div class="additional__content">
						<div class="additional__error-mes"></div>
						<input class="additional__city-input" type="text" placeholder="Please, enter a city">
					</div>
				</div>`);

			self.css({'height': model.options.height, 'width': model.options.width});
			if (model.activeState == 'main') {
				templateSettings.curT= mainState.curT;
				templateSettings.minT= mainState.minT;
				templateSettings.maxT= mainState.maxT;
				templateSettings.feelT= mainState.feelT;
				templateSettings.condition= mainState.condition;
				templateSettings.image= mainState.image;
				templateSettings.city= mainState.city;

				self.html(mainStateTmpl(templateSettings));
				return;
			}
			if (error) {
				templateSettings.error = error;
				model.additionalState.error = '';
			}
			self.html(additionStateTmpl(templateSettings));
			autocomplete();
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
			// console.log(model.activeState);
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

		function autocomplete() {
			self.find('.additional__city-input').autocomplete({
				serviceUrl: "http://autocomplete.wunderground.com/aq?cb=?",
				dataType: 'jsonp',
				paramName: 'query',
				transformResult: function(data) {
					console.log(data);
					return { suggestions: data['RESULTS'].filter(function(item) {return item.type == 'city';}).map(function(item) {
						return item.name;
					})};
				},
				onSelect: function(suggestion) {
					var city = self.find('.additional__city-input').val();
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
		}
};
$('.weather').weatherWidget({width: '500', height: '300'});

})(jQuery);
