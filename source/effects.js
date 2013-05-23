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
