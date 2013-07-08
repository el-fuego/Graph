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
     * @param {Object} val
     @param {String} options.x
     @param {String} options.y
     @param {String} options.radius
     @param {String} options.startDegree
     @param {String} options.endDegree
     @param {Object} [$container]
     @private
     */
    _renderSector: function (val, options, $container) {

        var isOutAngle = (options.endDegree - options.startDegree) > Math.PI;
        if (options.endDegree - options.startDegree >= Math.PI * 2) {
            options.endDegree = options.startDegree - 0.00001 + Math.PI * 2;
        }

        return this._render('path', {
            d: 'M ' + options.x + ',' + options.y + ' ' +
                'l ' + (options.radius * Math.cos(options.startDegree)) +
                    ',' + (options.radius * Math.sin(options.startDegree)) + ' ' +
                'A ' + options.radius + ',' + options.radius + ',0,' + (isOutAngle ? '1' : '0') + ',1,' +
                   (options.x + options.radius * Math.cos(options.endDegree)) + ',' +
                   (options.y + options.radius * Math.sin(options.endDegree)) + ' z',
            'class': options['class']
        }, $container);
    },


    /**
     * Получение параметров круговой диаграммы
     * @return {Object}
     */
    _getCircleDiagramOptions: function (values, options) {

        var self = this;
        var graphOptions = this._mergeGraphOptions(options);

        // сумма всех значений ( = 2*PI)
        graphOptions.valuesTotal = graphOptions.valuesTotal || _.reduce(values, function (total, val) {
            return total + (self._getValue(val));
        }, 0);
        graphOptions.radius = _.min([graphOptions.graphHeight, graphOptions.graphWidth]) / 2;
        graphOptions.x = this.options.width / 2;
        graphOptions.y = -this.options.height / 2;
        graphOptions.startDegree = 0;
        graphOptions.endDegree = 0;
        graphOptions.footnotePointsMargin = options.footnotePointsMargin || this.options.footnotePointsMargin;

        return graphOptions;
    },


    /**
     * Получение параметров сектора круговой диаграммы
     * @return {Object}
     */
    _getSectorOptions: function (val, index, graphOptions) {

        var sectorOptions = {
            'class':              this.options.sectorClass + ' n' + index + (val['class'] || ''),
            value:                this._getValue(val),
            name:                 val.name,
            startDegree:          graphOptions.endDegree,
            endDegree:            graphOptions.endDegree + (this._getValue(val)) * 2 * Math.PI / graphOptions.valuesTotal,
            radius:               graphOptions.radius,
            x:                    graphOptions.x,
            y:                    graphOptions.y,
            footnotePointsMargin: graphOptions.footnotePointsMargin,
            footnoteLength:       graphOptions.footnoteLength
        };

        graphOptions.startDegree = sectorOptions.startDegree;
        graphOptions.endDegree = sectorOptions.endDegree;

        return sectorOptions;
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
        var graphOptions = this._getCircleDiagramOptions(values, options || {});

        // Выводим группу
        var $group = this._render('g', {
            'class': this.options.circleDiagramClass + (graphOptions['class'] || '')
        });
        var $namesGroup = this._render('g', {
            'class': this.options.circleDiagramClass + (graphOptions['class'] || '')
        });
        // Эффект
        this._renderRadialGradient($group);

        // Выведем каждый элемент диаграммы
        _.map(values, function (val, i) {

            var sectorOptions = this._getSectorOptions(val, i, graphOptions);

            // Выведем сектор
            self._renderSector(val, sectorOptions, $group);

            if (sectorOptions.name != null) {
                self._renderSectorName(val, sectorOptions, $namesGroup);
            }
        }, this);

        return this;
    },


    /**
     * Строит название сноску с названием сектора
     * @param {Object} val
     * @param {String} options.x
     * @param {String} options.y
     * @param {String} options.radius
     * @param {String} options.startDegree
     * @param {String} options.endDegree
     * @param {Object} [$container]
     * @return {Number}
     */
    _renderSectorName: function (val, options, $container) {

        var centerDegree = (options.endDegree + options.startDegree) / 2;
        var isLeftSide = centerDegree > Math.PI / 2 && centerDegree < Math.PI * 1.5;
        var isTopSide = centerDegree > Math.PI;
        var sectorArcCenter = {
            x: options.x + options.radius * Math.cos(centerDegree),
            y: options.y + options.radius * Math.sin(centerDegree)
        };
        var secondPoint = {
            x: Math.round(sectorArcCenter.x + (isLeftSide ? -options.footnotePointsMargin : options.footnotePointsMargin)),
            y: Math.round(sectorArcCenter.y + (isTopSide ? -options.footnotePointsMargin : options.footnotePointsMargin)) + 0.5
        };

        // наклонная часть сноски
        this._render('line', {
            x1: sectorArcCenter.x,
            y1: sectorArcCenter.y,
            x2: secondPoint.x,
            y2: secondPoint.y,
            'class': this.options.sectorFootnote + ' ' + (val['class'] || '')
        }, $container);

        var textPosition = {
            x: secondPoint.x + (isLeftSide ? -options.footnotePointsMargin : options.footnotePointsMargin) / 2,
            y: secondPoint.y
        };

        // выводим текст
        var $textEl = this._render('text', {
            x: textPosition.x,
            y: textPosition.y,
            'class': this.options.sectorNameClass + ' ' + (val['class'] || ''),
            'text-anchor': (isLeftSide ? 'end' : 'start')
        }, $container);
        // перемещаем элемент
        textPosition.y += -$textEl.css('font-size').toString().replace(/[^0-9]/g, '') - 3;
        $textEl.attr('y', textPosition.y);
        this._appendTextNodes(val.name, textPosition, $textEl);

        // прямая часть сноски
        var footnoteLength = options.footnoteLength || ($textEl[0].offsetWidth ? $textEl[0].offsetWidth + options.footnotePointsMargin : this.options.footnoteLength);
        this._render('line', {
            x1: secondPoint.x,
            y1: secondPoint.y,
            x2: secondPoint.x + (isLeftSide ? -footnoteLength : footnoteLength),
            y2: secondPoint.y,
            'class': this.options.sectorFootnote + ' ' + (val['class'] || '')
        }, $container);
    }
});
