/* ********************************* */
//    Построение графиков и диаграмм 
//    JavaScript + SVG
//    https://github.com/el-fuego/Graph
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
        width: 450,
        height: 140,

        // Отступы
        paddingLeft: 20.5,
        paddingTop: 20.5,

        // Размер точки на линейном графике
        pointDiameter: 8,

        // Смещение значения по y
        valueOffsetY: 4,

        // Расстояние между столбцами
        rectStep: 5,

        // Количество линий в сетке
        greedLinesCount: 5,

        // Расстояние между точками в сноске
        footnotePointsMargin: 20,

        // Длинна сноски
        footnoteLength: 200,

        // Если секторов больше, чем минимальное кол-во и длинна дуги слишком маленькая, то у сноски будет сделать дополнительный отступ
        // Минимальное количество секторов для изменения размера сноски
        minSectorsCountForFootnoteResize: 4,
        // Длинна дуги сектора для изменения размера сноски
        sectorArcLengthForFootnoteResize: 50,

        /**
         * минимальная разница между длинами соседних дуг (используется при построении сносок круговых диаграмм)
         */
        minAdjacentArcsLengthDifference: 75,

        // классы
        rectDiagramClass: 'rect-diagram',
        circleDiagramClass: 'circle-diagram',
        verticalGreedClass: 'vertical-greed',
        rectClass: 'rect',
        rectNameClass: 'rect-name',
        sectorClass: 'sector',
        sectorNameClass: 'sector-name',
        sectorFootnote: 'sector-name-line',
        shapeClass: 'shape',
        lineClass: 'line',
        pointClass: 'point',
        valueClass: 'value',
        greedLineClass: 'greed-line',

        backgroundColor: '#F5F5F5'
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

                        width: this.options.width,
                        height: this.options.height
                    })
                    .appendTo(this.$el)
            );
    },


    /**
     * Строит группу
     * @param className {String}
     * @param options {Object}
     * @return {Number}
     */
    _renderGroup: function (className, options) {
        return this._render('g', {
            'class': className + (options && options['class'] ? ' ' + options['class'] : '')
        });
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
     * Добавляет текст в <text> с учетом переносов строк
     * @param text
     * @param options
     * @param $text
     * @private
     */
    _appendTextNodes: function (str, options, $text) {
        var words = str.toString().split('\n');
        var dy = +$text.css('font-size').toString().replace(/[^0-9]/g, '');
        var y = options.isBottomBaseLine ? options.y : options.y + dy;
        this._render('tspan', {
            x: options.x,
            y: y
        }, $text).append(options.isBottomBaseLine ? words.pop() : words.shift());
        if (words.length) {
            var word;
            while (word = options.isBottomBaseLine ? words.pop() : words.shift()) {
                y += options.isBottomBaseLine ? -dy : dy;
                this._render('tspan', {
                    x: options.x,
                    y: y
                }, $text).append(word);
            }
        }
    },


    /**
     * Опции построения графика
     * @param options {Object}
     * @return {Object}
     */
    _mergeGraphOptions: function (options) {
        var ret = {
            paddingLeft: options.paddingLeft != null ? options.paddingLeft : this.options.paddingLeft,
            paddingTop: options.paddingTop != null ? options.paddingTop : this.options.paddingTop
        };

        ret.graphWidth = options.width || (this.options.width - ret.paddingLeft * 2);
        ret.graphHeight = options.height || (this.options.height - ret.paddingTop * 2);
        return _.extend(
            {},
            options,
            ret
        );
    },


    /**
     * Возвращает числовое значение для графика
     * @private
     */
    _getValue: function (val) {
        return (typeof val === 'object' ? val.value : val) || 0;
    },


    /**
     * Получим максимальное значение на графике
     * @param  values [{Object|Number}]
     * @param [options] {Object}
     * @return {Number}
     */
    _getMaxValue: function (values, options) {
        var self = this;
        return options.maxValue || _.max(
            _.map(values, function (val) {
                return self._getValue(val);
            })
        );
    },


    /**
     * Укороченое значение
     * 1 000 000 => 1m
     * 1 000 => 1k
     * @param value {Float}
     * @returns {String}
     * @private
     */
    _getValueShortText: function (value) {
        if (Math.abs(value / 1000000) >= 1) {
            return (Math.round(value / 100000) / 10) + '\nмлн.';
        }
        if (Math.abs(value / 1000) >= 1) {
            return (Math.round(value / 100) / 10) + '\nтыс.';
        }
        return (Math.round(value * 10) / 10);
    }
};

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

/**
 *
 */
_.extend(window.Graph.prototype,
    /** @lends window.Graph.prototype */
    {
        /**
         * Создание сектора круга
         * @param val
         * @param options
         * @param $container
         * @returns {*}
         * @private
         */
        _renderSector: function (val, options, $container) {

            var isOutAngle = (options.endDegree - options.startDegree) > Math.PI;
            if (options.endDegree - options.startDegree >= Math.PI * 2) {
                options.endDegree = options.startDegree - 0.00001 + Math.PI * 2;
            }

            return this._render('path', _.extend({}, options, {
                d: 'M ' + options.x + ',' + options.y + ' ' +
                    'l ' + (options.radius * Math.cos(options.startDegree)) +
                    ',' + (options.radius * Math.sin(options.startDegree)) + ' ' +
                    'A ' + options.radius + ',' + options.radius + ',0,' + (isOutAngle ? '1' : '0') + ',1,' +
                    (options.x + options.radius * Math.cos(options.endDegree)) + ',' +
                    (options.y + options.radius * Math.sin(options.endDegree)) + ' z'
            }), $container);
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
            graphOptions.startDegree = graphOptions.startDegree || 0;
            graphOptions.endDegree = graphOptions.startDegree || 0;
            graphOptions.footnotePointsMargin = options.footnotePointsMargin || this.options.footnotePointsMargin;

            return graphOptions;
        },


        /**
         * Получение параметров сектора круговой диаграммы
         * @return {*}
         */
        _getSectorOptions: function (val, index, graphOptions, previousSectorOptions) {

            return _.extend(
                {},
                typeof val === 'object' ? val : {},
                {
                    'class': this.options.sectorClass + ' n' + index + " " + (val['class'] || ''),
                    value: this._getValue(val),
                    name: val.name,
                    startDegree: previousSectorOptions.endDegree,
                    endDegree: previousSectorOptions.endDegree + (this._getValue(val)) * 2 * Math.PI / graphOptions.valuesTotal,
                    radius: graphOptions.radius,
                    x: graphOptions.x,
                    y: graphOptions.y,
                    footnotePointsMargin: graphOptions.footnotePointsMargin,
                    footnoteLength: graphOptions.footnoteLength
                }
            );
        },


        /**
         * Вывод графика в виде круговой диаграммы
         * @param  values [{Object|Number}]
         * @param [options] {Object} {
         *    width:        200,  // px
         *    height:       200,  // px
         *    maxValue:     10,
         *    startDegree:  Math.PI / 2,
         *    valuesTotal:  100,
         *    'class':      ''
         * }
         * @return {this}
         */
        renderCircleDiagram: function (values, options) {

            var self = this,
                sectorsCount,

            // Параметры вывода
                graphOptions = this._getCircleDiagramOptions(values, options || {}),
                previousSectorOptions = graphOptions,
                previousSectorNameRenderResult,

            // Выводим группу
                $group = this._render('g', {
                    'class': this.options.circleDiagramClass + (graphOptions['class'] || '')
                }),
                $namesGroup = this._render('g', {
                    'class': this.options.circleDiagramClass + (graphOptions['class'] || '')
                });

            // Эффект
            this._renderRadialGradient($group);

            sectorsCount = values.length;

            // Выведем каждый элемент диаграммы
            _.map(values, function (val, i) {

                var sectorOptions = this._getSectorOptions(val, i, graphOptions, previousSectorOptions);
                previousSectorOptions = sectorOptions;

                sectorOptions.sectorsCount = sectorsCount;
                sectorOptions.previousSectorNameRenderResult = previousSectorNameRenderResult;

                // Выведем сектор
                self._renderSector(val, sectorOptions, $group);

                if (sectorOptions.name != null) {
                    previousSectorNameRenderResult = self._renderSectorName(val, sectorOptions, $namesGroup);
                } else {
                    previousSectorNameRenderResult = null;
                }
            }, this);

            return this;
        },


        /**
         * Вывод текста названия сектора
         * @param {Object} val
         * @param {String} options.x
         * @param {String} options.y
         * @param {String} options.radius
         * @param {String} options.startDegree
         * @param {String} options.endDegree
         * @param {String} options.isLeftSide
         * @param {String} options.sectorArcCenter
         * @param {String} options.sectorArcCenter.x
         * @param {String} options.sectorArcCenter.y
         * @param {Object} [$container]
         * @returns {jQuery}
         * @private
         */
        _renderSectorNameText: function (val, options, $container) {

            var textPosition = {
                x: options.x + (options.isLeftSide ? -options.footnotePointsMargin : options.footnotePointsMargin) / 2,
                y: options.y
            };

            // выводим текст
            var $textEl = this._render('text', {
                x: textPosition.x,
                y: textPosition.y,
                'class': this.options.sectorNameClass + ' ' + (val['class'] || ''),
                'text-anchor': (options.isLeftSide ? 'end' : 'start')
            }, $container);

            // перемещаем элемент
            textPosition.y += -$textEl.css('font-size').toString().replace(/[^0-9]/g, '') - 3;
            $textEl.attr('y', textPosition.y);
            this._appendTextNodes(val.name, textPosition, $textEl);

            return $textEl;
        },


        /**
         * Строит название сноску с названием сектора
         * @param {Object} val
         * @param {String} options.x
         * @param {String} options.y
         * @param {String} options.radius
         * @param {String} options.startDegree
         * @param {String} options.endDegree
         * @param {String} [options.footnoteLength]
         * @param {String} [options.footnotePointsMargin]
         * @param {Object} [$container]
         */
        _renderSectorName: function (val, options, $container) {

            var isLeftSide,
                isTopSide,
                sectorArcCenter,
                secondPoint,
                factor,
                sectorArcLengthForFootnoteResize = this.options.sectorArcLengthForFootnoteResize,
                centerDegree = (options.endDegree + options.startDegree) / 2,
                centerDegreePerCircle = centerDegree,
                previousSectorNameRenderResult = options.previousSectorNameRenderResult,

                /**
                 * отступ для сноски, используется опционально
                 */
                footnoteMargin = options.footnotePointsMargin,
                /**
                 * внутренний угол. Приведем к градусам
                 */
                insideCorner = (options.endDegree - options.startDegree) * 180 / Math.PI,
                /**
                 * Длинна дуги (Pi * r * corner (in degree) / 180)
                 */
                sectorArcLength = Math.round((Math.PI * options.radius * insideCorner) / 180);

            while (centerDegreePerCircle > Math.PI * 2) {
                centerDegreePerCircle += -Math.PI * 2;
            }
            isLeftSide = centerDegreePerCircle > Math.PI / 2 && centerDegreePerCircle < Math.PI * 1.5;
            isTopSide = centerDegreePerCircle > Math.PI;
            sectorArcCenter = {
                x: options.x + options.radius * Math.cos(centerDegree),
                y: options.y + options.radius * Math.sin(centerDegree)
            };
            secondPoint = {
                x: Math.round(sectorArcCenter.x + (isLeftSide ? -options.footnotePointsMargin : options.footnotePointsMargin)),
                y: Math.round(sectorArcCenter.y + (isTopSide ? -options.footnotePointsMargin : options.footnotePointsMargin)) + 0.5
            };

            /**
             * Если секторов больше, чем минимальное кол-во и длинна дуги слишком маленькая,
             * то нужно сделать дополнительный отступ для сноски
             */
            if (
                options.sectorsCount >= this.options.minSectorsCountForFootnoteResize &&
                    sectorArcLength < sectorArcLengthForFootnoteResize && (
                        !previousSectorNameRenderResult ||
                            previousSectorNameRenderResult.sectorArcLength < sectorArcLengthForFootnoteResize || (
                                previousSectorNameRenderResult && (
                                    Math.abs(previousSectorNameRenderResult.sectorArcLength - sectorArcLength) <=
                                        this.options.minAdjacentArcsLengthDifference && (
                                            sectorArcLength < sectorArcLengthForFootnoteResize ||
                                                previousSectorNameRenderResult.sectorArcLength < sectorArcLengthForFootnoteResize
                                        )
                                )
                            )
                    )
            ) {
                if (
                    sectorArcLength < 10 || (
                        previousSectorNameRenderResult &&
                            previousSectorNameRenderResult.sectorArcLength < sectorArcLengthForFootnoteResize &&
                            previousSectorNameRenderResult.isTopSide === isTopSide &&
                            previousSectorNameRenderResult.isLeftSide === isLeftSide
                    )
                ) {
                    factor = 2;
                } else {
                    factor = 1;
                }

                secondPoint.y += factor * (isTopSide ? -footnoteMargin : footnoteMargin);
            }

            // наклонная часть сноски
            this._render('line', {
                x1: sectorArcCenter.x,
                y1: sectorArcCenter.y,
                x2: secondPoint.x,
                y2: secondPoint.y,
                'class': this.options.sectorFootnote + ' ' + (val['class'] || '')
            }, $container);


            // текст
            var $textEl = this._renderSectorNameText(val, _.extend({}, options, {
                centerDegree: centerDegree,
                sectorArcCenter: sectorArcCenter,
                isLeftSide: isLeftSide,
                isTopSide: isTopSide,
                x: secondPoint.x,
                y: secondPoint.y
            }), $container);

            // прямая часть сноски
            var footnoteLength = options.footnoteLength || ($textEl[0] && $textEl[0].offsetWidth ? $textEl[0].offsetWidth + options.footnotePointsMargin : this.options.footnoteLength);
            this._render('line', {
                x1: secondPoint.x,
                y1: secondPoint.y,
                x2: secondPoint.x + (isLeftSide ? -footnoteLength : footnoteLength),
                y2: secondPoint.y,
                'class': this.options.sectorFootnote + ' ' + (val['class'] || '')
            }, $container);

            return {
                sectorArcLength: sectorArcLength,
                isTopSide: isTopSide,
                isLeftSide: isLeftSide
            };
        }
    });
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
     * Вывод фильтра радиального градиетнта
	 * @param $container
     * @private
     */
    _renderRadialGradient: function ($container) {
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
     * Вывод фильтра внешнее свечение
     * @param options
     * @param $container
     * @private
     */
    _renderTextGlow: function (options, $container) {
        var $filter = this._render("filter", {
            id: 'text-glow'
        });

        // внешнее свечение
        this._render("feFlood", {
            'flood-color': options.backgroundColor || this.options.backgroundColor
        }, $filter);
        this._render("feComposite", {
            in2:      'SourceGraphic',
            operator: 'in'
        }, $filter);
        this._render("feGaussianBlur", {
            stdDeviation:  2
        }, $filter);

        // усиление яркости
        var $transfer = this._render("feComponentTransfer", {}, $filter);
        this._render("feFuncA", {
            type:     'gamma',
            exponent:  1,
            amplitude: 6
        }, $transfer);

        this._render("feComposite", {
            'in':      'SourceGraphic'
        }, $filter);

        ($container || this.$workspace).attr({
            filter: 'url(#text-glow)'
        });
    }
});

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

            var position = (graphOptions.paddingTop +
                           self.options.valueOffsetY + graphOptions.pointRadius +
                           (self._getValue(val)) * graphOptions.graphHeight / graphOptions.maxValue) || 0;
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

        rectOptions.height = Math.round((this._getValue(val)) * graphOptions.graphHeight / graphOptions.maxValue) || 0;
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
