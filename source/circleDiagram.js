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
                            previousSectorNameRenderResult.sectorArcLength < sectorArcLengthForFootnoteResize
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