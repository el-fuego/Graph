/* ********************************* */
//    Построение графиков и диаграмм 
//    JavaScript + SVG
//
//
//    Author:   Pulyaev Y.A.
//
//    Email:    watt87@mail.ru
//    VK:       el_fuego_zaz
/* ********************************* */


/**
 @class Построение графиков и диаграмм
 @param {Object} settings
 @param {Object} settings.el Место вставки
 */
window.Graph = function (options) {

    // применим настройки
    this.$el = $(options.el || options.$el);
    this.options = _.extend({}, this.options, options);

    // Создадим чистую рабочую область
    this.clear();
};

/** */
window.Graph.prototype = {


    /** Область svg */
    SVG_NS: "http://www.w3.org/2000/svg",

    /** Настройки по умолчанию */
    options: {

        // Ширина и высота графика
        width:         450,
        height:        140,

        // Отступы
        paddingLeft:   10,
        paddingTop:    10,

        // Размер точки на линейном графике
        pointDiameter: 8,

        // Расстояние между столбцами
        rectStep:   5,
		
		// классы
		rectDiagramClass: 	'rect-diagram',
		circleDiagramClass: 'circle-diagram',
		rectClass: 			'rect',
		sectorClass: 		'sector'
    },


    /**
     Создание нового SVG-тега
     @param {String} name
     @param {Object} [attributes]
     @param {Object} [$container]
     @private
     */
    _render: function (name, attributes, $container) {

        var el = document.createElementNS(this.SVG_NS, name);
        var i;
        for (i in attributes || {}) {
            if (i) {
                el.setAttributeNS(null, i, attributes[i]);
            }
        }

        $($container || this.$workspace).append(el);
        return $(el);
    },


    /**
     Создание сектора круга
     @param {String} centerX
     @param {String} centerY
     @param {String} radius
     @param {String} startDegree
     @param {String} endDegree
     @param {Object} [attributes]
     @param {Object} [$group]
     @private
     */
	_renderSector: function (centerX, centerY, radius, startDegree, endDegree, attributes, $group) {
		
		var isOutAngle = (endDegree - startDegree) > Math.PI
	
        return this._render('path', _.extend(
            {
                d: 'M ' + centerX + ',' + centerY + ' ' +
                    'l ' + (radius * Math.cos(startDegree)) +
                        ',' + (radius * Math.sin(startDegree)) + ' ' +
					'A ' + radius + ',' + radius + ',0,' + (isOutAngle ? '1' : '0') + ',1,' +
                       (centerX + radius * Math.cos(endDegree)) + ',' +
                       (centerY + radius * Math.sin(endDegree)) + ' z'
            },
            attributes || {}
		), $group);
    },


    /**
     Создание рабочего простаранства
     @private
     */
    _renderWorkspace: function () {

        return $(document.createElementNS(this.SVG_NS, "g"))
            .attr({
                transform: 'translate(0, ' + this.options.height + ')'
            })
            .appendTo(
                $('<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" ></svg>')
                    .attr({

                        width:  this.options.width,
                        height: this.options.height
                    })
                    .appendTo(this.$el)
            );
    },


    /**
     Очистка рабочего простаранства
     */
    clear: function () {

        if (this.$workspace) {
            this.$workspace.remove();
        }
        this.$workspace = this._renderWorkspace();
    },

	
	/**
	 * Опции построения графика 
     * @param options {Object}
     * @return {Object}
	 */
	_mergeGraphOptions: function (options) {
        var ret = {
            paddingLeft: options.paddingLeft || this.options.paddingLeft,
            paddingTop:  options.paddingTop  || this.options.paddingTop
        };

        ret.graphWidth =  options.width  || (this.options.width - ret.paddingLeft*2);
        ret.graphHeight = options.height || (this.options.height - ret.paddingTop*2);
		return _.extend(
            {},
            options,
            ret
        );
	},


    /**
     * Получим максимальное значение на графике
     * @param  values [{Object|Number}]
     * @param [options] {Object}
     * @return {Number}
     */
    _getMaxValue: function (values, options) {

        return options.maxValue || _.max(
            _.map(values, function (val) {
                return val.value || val;
            })
        );
    },


    /**
     * Шаг точек
     * @param  values [{Object|Number}]
     * @param [options] {Object} {
     *    graphWidth:  200,
     *    step:        10
     * }
     * @return {Number}
     */
    _getPointStep: function (values, options) {
        return options.step || (options.graphWidth / (values.length - 1))
    },


    /**
     * Получим все точки кривой
     * @param  values [{Object|Number}]
     * @param [options] {Object} {
     *    graphHeight:  200,
     *    maxValue:     10
     * }
     * @return [{DOMNode}}
     */
    _getGraphPoints: function (values, options) {

        var step = this._getPointStep(values, options);
        var maxValue = this._getMaxValue(values, options);

        return _.map(values, function (val, i) {
            return (step * i) + ',' + (-1 * (val.value || val) * options.graphHeight / maxValue)
        });
    },
	

    /**
     Вывод графика в виде линии с залитой областью под ней
     * @param  values [{Object|Number}]
     * @param [options] {Object} {
     *    paddingLeft:  0,   // px
     *    paddingTop:   0,   // px
     *    width:        400, // px
     *    height:       200, // px
     *    maxValue:     10,
     *    step:         10,  // px
     *    'class':      ''
     * }
     * @return [{DOMNode}}
     */
    renderShape: function (values, options) {

        // Параметры вывода
		var graphOptions = this._mergeGraphOptions(options || {});
		
        // Получим все точки кривой
        var svgPointsArray = this._getGraphPoints(values, graphOptions);

        // Добавим по одной вначале и вконце для фона
        svgPointsArray.unshift(_.first(svgPointsArray).replace(/,[0-9.-]+/, '') + ',0');
        svgPointsArray.push(_.last(svgPointsArray).replace(/,[0-9.-]+/, '') + ',0');

        // Выведем фон
		return this._render('polyline', _.extend(graphOptions, {
			points:  svgPointsArray.join(' '),
			'class': 'shape ' + (graphOptions['class'] || '')
		}));
    },


    /**
     Вывод графика в виде линии
     * @param  values [{Object|Number}]
     * @param [options] {Object} {
     *    paddingLeft:  0,   // px
     *    paddingTop:   0,   // px
     *    width:        400, // px
     *    height:       200, // px
     *    maxValue:     10,
     *    step:         10,  // px
     *    'class':      ''
     * }
     * @return [{DOMNode}}
     */
    renderLine: function (values, options) {

        // Параетры вывода
		var graphOptions = this._mergeGraphOptions(options || {});
		
        // Получим все точки кривой
        var svgPointsArray = this._getGraphPoints(values, graphOptions);

        // Выведем кривую
        return this._render('polyline', _.extend(graphOptions, {
            points: svgPointsArray.join(' ')
        }));
    },


    /**
     Вывод графика в виде точек
     * @param  values [{Object|Number}]
     * @param [options] {Object} {
     *    paddingLeft:  0,   // px
     *    paddingTop:   0,   // px
     *    width:        400, // px
     *    height:       200, // px
     *    maxValue:     10,
     *    step:         10,  // px
     *    pointDiameter: 20, // px
     *    'class':      ''
     * }
     * @return [{DOMNode}}
     */
    renderPoints: function (values, options) {

        var self = this;

        // Параетры вывода
        var graphOptions = this._mergeGraphOptions(options || {});
        var pointRadius = (graphOptions.pointDiameter || this.options.pointDiameter) / 2;
        var maxValue = this._getMaxValue(values, graphOptions);
        var step = this._getPointStep(values, graphOptions);

        // Выведем точки кривой
        return _.map(values, function (val, i) {

            var height = (val.value || val) * graphOptions.graphHeight / maxValue;
            return self._render('circle', _.extend(
                {},
				typeof val === 'object' ? val : {},
				{
					cx: step * i,
					cy: -height,
					r:  pointRadius,
					value: val.value || val
				}
			));

        });
    },
	
	
	/**
	 * Подсчитывает место, занимаемое отступами
     * @return {Number}
	 */
	_getStepsTotal: function (values, options) {
		
		var i = 0;
		return _.reduce(values, function (total, val) {
			return total += options.step(val, i++);
		}, 0);
	},


    /**
     * Вывод графика в виде диаграммы
     * @param  values [{Object|Number}]
     * @param [options] {Object} {
     *    paddingLeft:  0,    // px
     *    paddingTop:   0,    // px
     *    width:        400,  // px
     *    height:       200,  // px
     *    maxValue:     10,
     *    rectWidth:    20,   // px
     *    'class':      ''
     * }
     * @return [{DOMNode}}
     */
    renderRectDiagram: function (values, options) {

        var self = this;

        // Параметры вывода
        var graphOptions = this._mergeGraphOptions(options || {});
        var step = graphOptions.step || this.options.rectStep;
        var rectWidth = graphOptions.rectWidth ||
                        Math.round(
                            (graphOptions.graphWidth / values.length) - (
                                typeof step === 'function' ?
                                this._getStepsTotal(values, graphOptions) / values.length :
                                step
                                )
                        );
        var maxValue = this._getMaxValue(values, graphOptions);

        // крайняя правая точка предудущего столбца
        var previousLastX = graphOptions.paddingLeft;

		// Выводим группу
		var $group = this._render('g', {
			'class': this.options.rectDiagramClass + ' ' + (graphOptions['class'] || '')
		});

        // Выведем каждый столбец диаграммы
        return _.map(values, function (val, i) {

			// вычислим отсутп, ширину, высоту и позиции
			var currentStep = typeof step === 'function' ?
				step(val, i) :
				Math.round(step);
				
			var currentWidth = typeof rectWidth === 'function' ?
				rectWidth(val, i, {step: currentStep}) :
				Math.round(rectWidth);
				
			var height = Math.round(graphOptions.paddingTop + (val.value || val) * graphOptions.graphHeight / maxValue);
			var currentX = previousLastX;
			previousLastX = currentX + currentStep + currentWidth;
			
            return self._render('rect', _.extend(
                {},
				typeof val === 'object' ? val : {},
				{
					x: 		currentX,
					y:      -height,
					width:  currentWidth,
					height: height,
					value:  val.value || val,
					'class': self.options.rectClass + ' ' + (val['class'] || '')
				}
			), $group);

        });
    },

    /**
     * Вывод фильтра
	 * @param $container
     * @private
     */
    _renderGradient: function ($container) {
        var size = _.min([this.options.width, this.options.height]);

        // FILTER
        var $filter = this._render("filter", {
            id: 'shadow'
        });

        // blur
        this._render("feGaussianBlur", {
            result: "offset-blur",
            stdDeviation: size / 4 // размер размытия
        }, $filter);

        // composite
        this._render('feComposite', {
            operator: 'arithmetic',
            k1:       '3',   // уровень фильтра
            k2:       '0.6', // уровень исходного изображения
            k3:       '0',
            k4:       '0',
            'in':     'SourceGraphic',
            in2:      'offset-blur'
        }, $filter);

		($container || this.$workspace).attr({
            filter: 'url(#shadow)'
        });
    },

    /**
     * Вывод графика в виде круговой диаграммы
     * @param  values [{Object|Number}]
     * @param [options] {Object} {
     *    width:        200,  // px
     *    height:       200,  // px
     *    maxValue:     10,
     *    valuesTotal:  100,
     *    'class':      ''
     * }
     * @return [{DOMNode}}
     */
    renderCircleDiagram: function (values, options) {

        var self = this;

        // Параметры вывода
        var graphOptions = this._mergeGraphOptions(options || {});
        // сумма всех значений ( = 2*PI)
        var valuesTotal = graphOptions.valuesTotal || _.reduce(values, function (total, val) {
            return total + (val.value || val);
        }, 0);
        var radius = _.min([graphOptions.graphHeight, graphOptions.graphWidth]) / 2;
        var centerX = radius;
        var centerY = -radius;
        var endDegree = 0;

        // Выводим группу
        var $group = this._render('g', {
            'class': this.options.circleDiagramClass + (graphOptions['class'] || '')
        });
        // Эффект
        this._renderGradient($group);

        // Выведем каждый элемент диаграммы
        return _.map(values, function (val, i) {
            var elementOptions = _.extend(
                {},
				typeof val === 'object' ? val : {},
                {
					'class': self.options.sectorClass + ' n' + i + (val['class'] || ''),
					value: val.value || val
                }
            );
            var startDegree = endDegree;
            endDegree = startDegree + (val.value || val) * 2 * Math.PI / valuesTotal;

            // Выведем сектор
			return self._renderSector(centerX, centerY, radius, startDegree, endDegree, elementOptions, $group)
        });
    }
};
