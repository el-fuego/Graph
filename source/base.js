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
