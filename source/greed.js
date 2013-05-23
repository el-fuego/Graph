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


/** */
_.extend(window.Graph.prototype, {


    /**
     * отступ для сетки
     * @return {Number}
     */
    _getGreedStep: function (maxValue, options) {

        if (options.step) {
            return options.step;
        }
        if (options.valueStep) {
            return options.valueStep * options.graphHeight / maxValue;
        }

        // 2030 => 1000
        // 9080 => 10000
        var valueExponent = 1;
        var remainder = maxValue / options.count;
        while(Math.round(remainder / 10) > 0) {
            remainder = remainder / 10;
            valueExponent = valueExponent * 10;
        }

        var valueStep = Math.floor(maxValue / (options.count * 0.1 * valueExponent)) * 0.1 * valueExponent;

        return Math.floor(valueStep * options.graphHeight / maxValue);
    },


    /**
     * Вывод сетки
     * @param  values [{Object|Number}]
     * @param [options] {Object} {
     *    paddingLeft:  0,    // px
     *    paddingTop:   0,    // px
     *    width:        400,  // px
     *    height:       200,  // px
     *    [maxValue]:   10,
     *    [step]:       100,
     *    count:        20,
     *    'class':      ''
     * }
     * @return [{DOMNode}}
     */
    renderVerticalGreed: function (values, options) {

        // Параметры вывода
        var graphOptions = this._mergeGraphOptions(options || {});
        if (!graphOptions.count) {
            graphOptions.count = this.options.greedLinesCount;
        }
        var maxValue = this._getMaxValue(values, graphOptions);
        var step = this._getGreedStep(maxValue, graphOptions);

        // Выводим группу
        var $group = this._render('g', {
            'class': this.options.verticalGreedClass + ' ' + (graphOptions['class'] || '')
        });

        // Выведем каждую линию
        var lines = [];
        var i = graphOptions.count;
        while (i--){
            var position = -graphOptions.paddingTop - i * step;

            lines.push(this._render('line', _.extend(
                {},
                {
                    x1: graphOptions.paddingLeft,
                    y1: position,
                    x2: graphOptions.paddingLeft + graphOptions.graphWidth,
                    y2: position,
                    'class': this.options.greedLineClass
                }
            ), $group));
        }

        return lines;
    }
});
