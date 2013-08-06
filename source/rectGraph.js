/* ********************************* */
//    Построение графиков и диаграмм 
//    JavaScript + SVG
//    https://github.com/el-fuego/Graph
//
//
//    Author:   Pulyaev Y.A.
//
//    Email:    watt87@mail.ru
//    VK:       el_fuego_zaz
/* ********************************* */

/** */
_.extend(window.Graph.prototype, {

	_getDefaultRectWidth: function (values, graphOptions) {
		return Math.round(
			 (graphOptions.graphWidth / values.length) - (
				 typeof graphOptions.step === 'function' ?
				 this._getRectStepsTotal(values, graphOptions) / values.length :
				 graphOptions.step
				 )
			)
	},
	

    /**
     * Получение параметров столбцового графика
     * @return {Object}
     */
    _getRectGraphOptions: function (values, options) {

        var graphOptions = this._mergeGraphOptions(options);

        graphOptions.step = graphOptions.step || this.options.rectStep;
		
        graphOptions.defaultRectWidth = this._getDefaultRectWidth(values, graphOptions);
        graphOptions.rectWidth = graphOptions.rectWidth ||
                                 graphOptions.defaultRectWidth;
        graphOptions.maxValue = this._getMaxValue(values, graphOptions);

        // крайняя правая точка предудущего столбца
        graphOptions.previousEndsX = graphOptions.paddingLeft;

        return graphOptions;
    },


    /**
     * Получение параметров столбца
     * @return {Object}
     */
    _getRectOptions: function (val, index, graphOptions) {
        var rectOptions = {};

        // вычислим отсутп, ширину, высоту и позиции
        var currentStep = typeof graphOptions.step === 'function' ?
                          graphOptions.step(val, index, this.options.rectStep) :
                          Math.round(graphOptions.step);

        rectOptions.width = typeof graphOptions.rectWidth === 'function' ?
                            graphOptions.rectWidth(val, index, graphOptions.defaultRectWidth) :
                            Math.round(graphOptions.rectWidth);

        rectOptions.height = Math.round((this._getValue(val)) * graphOptions.graphHeight / graphOptions.maxValue);
        rectOptions.x = graphOptions.previousEndsX;
        rectOptions.y = -graphOptions.paddingTop - rectOptions.height;
        graphOptions.previousEndsX = rectOptions.x + currentStep + rectOptions.width;

        return rectOptions;
    },


    /**
     * Подсчитывает место, занимаемое отступами
     * @return {Number}
     */
    _getRectStepsTotal: function (values, options) {
        var i = 0;
        return _.reduce(values, function (total, val) {
            return total += options.step(val, i++);
        }, 0);
    },


    /**
     * Строит столбец
     * @param val {Number|Object}
     * @param options {Object}
     * @param $container {Object}
     * @return {Number}
     */
    _renderRect: function (val, options, $container) {
        return this._render('rect', {
            x: 	     options.x,
            y:       options.y,
            width:   options.width,
            height:  options.height,
            value:   this._getValue(val),
            'class': this.options.rectClass + ' ' + (val['class'] || '')
        }, $container);
    },


    /**
     * Строит название столбца
     * @param val {Number|Object}
     * @param options {Object}
     * @param $container {Object}
     * @return {Number}
     */
    _renderRectName: function (val, options, $container) {
        var x = options.x + options.width/2;
        var y = options.y + this.options.valueOffsetY + options.height;
        var $textEl = this._render('text', {
            x: x,
            y: y,
            'class': this.options.rectNameClass + ' ' + (val['class'] || '')
        }, $container);

        this._appendTextNodes(
            val.name,
            {
                x: x,
                y: y
            },
            $textEl
        );

        return $textEl;
    },


    /**
     * Строит значение столбца
     * @param val {Number|Object}
     * @param options {Object}
     * @param graphOptions {Object}
     * @param $container {Object}
     * @return {Number}
     */
    _renderRectValue: function (val, options, graphOptions, $container) {
        var x = options.x + options.width/2;
        var y = options.y - this.options.valueOffsetY;
        var $text =  this._render('text', _.extend(
            {},
            typeof val === 'object' ? val : {},
            {
                x:       x,
                y:       y,
                'class': this.options.valueClass + ' ' + (val['class'] || '')
            }
        ), $container);

        this._appendTextNodes(
            graphOptions.fullText ?
                this._getValue(val) :
                this._getValueShortText(this._getValue(val)),
            {
                x: x,
                y: y,
                isBottomBaseLine: true
            },
            $text
        );

        return $text;
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
     * @return {this}
     */
    renderRectDiagram: function (values, options) {

        var self = this;

        // Параметры вывода
        var graphOptions = this._getRectGraphOptions(
            values,
            options || {}
        );

        // Выводим группы
        var $group = this._renderGroup(this.options.rectDiagramClass, graphOptions);
        var $namesGroup = this._renderGroup(this.options.rectDiagramClass, graphOptions);
        // внешнее свечение
        this._renderTextGlow(graphOptions, $namesGroup);

        // Выведем каждый столбец диаграммы
        _.each(values, function (val, i) {

            var rectOptions = self._getRectOptions(val, i, graphOptions);
            if (val.name) {
                self._renderRectName(val, rectOptions, $namesGroup);
            }
            self._renderRect(val, rectOptions, $group);
        });

        return this;
    },


    /**
     * Вывод значений столбцов
     * @param  values [{Object|Number}]
     * @param [options] {Object} {
     *    paddingLeft:  0,    // px
     *    paddingTop:   0,    // px
     *    width:        400,  // px
     *    height:       200,  // px
     *    maxValue:     10,
     *    rectWidth:    20,   // px
     *    fullText:     false,
     *    'class':      ''
     * }
     * @return {this}
     */
    renderRectsValues: function (values, options) {

        var self = this;
        // Параметры вывода
        var graphOptions = this._getRectGraphOptions(
            values,
            options || {}
        );

        // Выводим группу
        var $group = this._renderGroup(this.options.rectDiagramClass, graphOptions);

        // внешнее свечение
        this._renderTextGlow(graphOptions, $group);

        _.each(values, function (val, i) {
            var rectOptions = self._getRectOptions(val, i, graphOptions);
            self._renderRectValue(val, rectOptions, graphOptions, $group);
        });

        return this;
    }
});
