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



    /**
     * Получение параметров столбцового графика
     * @return {Object}
     */
    _getPointsGraphOptions: function (values, options) {

        var graphOptions = this._mergeGraphOptions(options || {});

        graphOptions.pointRadius = (graphOptions.pointDiameter || this.options.pointDiameter) / 2;
        graphOptions.maxValue = this._getMaxValue(values, graphOptions);
        graphOptions.step = this._getPointStep(values, graphOptions);

        return graphOptions;
    },


    /**
     * Получим все точки кривой
     * @param  values [{Object|Number}]
     * @param [options] {Object} {
     *    graphHeight:  200,
     *    maxValue:     10
     * }
     * @return ['1,5', '2,3']
     */
    _getGraphPoints: function (values, options) {

        var self = this;
        var step = this._getPointStep(values, options);
        var maxValue = this._getMaxValue(values, options);

        return _.map(values, function (val, i) {
            return (options.paddingLeft + step * i) + ',' + (-options.paddingTop - self._getValue(val) * options.graphHeight / maxValue)
        });
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
     * @return {this}
     */
    renderShape: function (values, options) {

        // Параметры вывода
        var graphOptions = this._mergeGraphOptions(options || {});

        // Получим все точки кривой
        var svgPointsArray = this._getGraphPoints(values, graphOptions);

        // Добавим по одной вначале и вконце для фона
        svgPointsArray.unshift(
            _.first(svgPointsArray).replace(/,[0-9.-]+/, '') +
            ',' +
            (-graphOptions.paddingTop)
        );
        svgPointsArray.push(
            _.last(svgPointsArray).replace(/,[0-9.-]+/, '') +
            ',' +
            (-graphOptions.paddingTop)
        );

        // Выведем фон
        this._render('polyline', _.extend(graphOptions, {
            points:  svgPointsArray.join(' '),
            'class': this.options.shapeClass + ' ' + (graphOptions['class'] || '')
        }));

        return this;
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
     * @return {this}
     */
    renderLine: function (values, options) {

        // Параетры вывода
        var graphOptions = this._mergeGraphOptions(options || {});

        // Получим все точки кривой
        var svgPointsArray = this._getGraphPoints(values, graphOptions);

        // Выведем кривую
        this._render('polyline', _.extend(graphOptions, {
            points: svgPointsArray.join(' '),
            'class': this.options.lineClass
        }));

        return this;
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
     * @return {this}
     */
    renderPoints: function (values, options) {

        var self = this;

        // Параетры вывода
        var graphOptions = this._getPointsGraphOptions(values, options);

        // Выведем точки кривой
        _.each(values, function (val, i) {

            var height = graphOptions.paddingTop + (self._getValue(val)) * graphOptions.graphHeight / graphOptions.maxValue;
            self._render('circle', _.extend(
                {},
                typeof val === 'object' ? val : {},
                {
                    cx:      graphOptions.paddingLeft + graphOptions.step * i,
                    cy:      -height,
                    r:       graphOptions.pointRadius,
                    value:   self._getValue(val),
                    'class': self.options.pointClass
                }
            ));

        });

        return this;
    },


    /**
     * Вывод значений над точками
     * @param  values [{Object|Number}]
     * @param [options] {Object} {
     *    paddingLeft:  0,   // px
     *    paddingTop:   0,   // px
     *    width:        400, // px
     *    height:       200, // px
     *    maxValue:     10,
     *    step:         10,  // px
     *    pointDiameter: 20, // px
     *    fullText:     false,
     *    'class':      ''
     * }
     * @return {this}
     */
    renderPointsValues: function (values, options) {

        var self = this;

        // Параетры вывода
        var graphOptions = this._getPointsGraphOptions(values, options);

        // Выводим группу
        var $group = this._renderGroup(graphOptions['class'] || '');

        // внешнее свечение
        this._renderTextGlow(graphOptions, $group);

        _.each(values, function (val, i) {

            var position = graphOptions.paddingTop +
                           self.options.valueOffsetY + graphOptions.pointRadius +
                           (self._getValue(val)) * graphOptions.graphHeight / graphOptions.maxValue;
            var x = graphOptions.paddingLeft + graphOptions.step * i;
            var $text = self._render(
                'text',
                _.extend(
                    {},
                    typeof val === 'object' ? val : {},
                    {
                        x:      x,
                        y:      -position,
                        'class': self.options.valueClass
                    }
                ),
            $group);

            self._appendTextNodes(
                graphOptions.fullText ?
                self._getValue(val) :
                self._getValueShortText(self._getValue(val)),
                {
                    x: x,
                    y: -position,
                    isBottomBaseLine: true
                },
                $text
            );
        });

        return this;
    }
});
