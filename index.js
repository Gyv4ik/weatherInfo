(function($, undefined) {

$.Widget('weather.weatherInfo', {

	options: {
		height: 200,
		width: 300
	},

	_create: function() {
		var height = this.options.height + "px";
		var width = this.options.width + "px";

		this.element
			.addClass('weatherInfo')
			.text(height);
	},

	_getInfo: function() {
		var cityName = Kharkov;
		var url = 'http://api.openweathermap.org/data/2.5/weather?q='+cityName+',uk&appid=2de143494c0b295cca9337e1e96b00e0';
		var jxhr = $.get(url)
			.success(function(data) {
				console.log(data);
			});
	},

	height: function(value) {
		if (value === undefined) return this.options.height;
		this.options.height = value;
	},

	width: function(value) {
		this.options.width = value;
	}
});

var main = $('.main').weather()._getInfo();

})(jQuery);
