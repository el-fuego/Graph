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

        var isOutAngle = (endDegree - startDegree) > Math.PI;
        if (endDegree - startDegree >= Math.PI * 2) {
            endDegree = startDegree - 0.00001 + Math.PI * 2;
        }

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
            return total + (self._getValue(val));
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
        this._renderRadialGradient($group);

        // Выведем каждый элемент диаграммы
        return _.map(values, function (val, i) {
            var elementOptions = _.extend(
                {},
                typeof val === 'object' ? val : {},
                {
                    'class': self.options.sectorClass + ' n' + i + (val['class'] || ''),
                    value: self._getValue(val)
                }
            );
            var startDegree = endDegree;
            endDegree = startDegree + (self._getValue(val)) * 2 * Math.PI / valuesTotal;

            // Выведем сектор
            return self._renderSector(centerX, centerY, radius, startDegree, endDegree, elementOptions, $group)
        });
    }
});
