<h1>Graph JS + SVG</h1> 
<h3>Линейные, столбцовые графики и круговые дигараммы.</h3>
**Библиотека позволяет построить график в виде линий, столбцовой и круговой дигарамм на JavaScript.**

<a href="https://github.com/el-fuego/Graph/blob/master/graph.zip?raw=true"> [Скачать] </a>

* Ничего лишнего, **6kb** minified
* Поддержка IE http://caniuse.com/#search=svg
* Использование **CSS** для определения стилей
* Установка дополнительных аттрибутов к DOM-объектам
* Возможность установки событий на элементы графиков
* Требует: jQuery, Lodash/Underscore

<img src="http://s3.uploads.ru/a2dov.png" />

<hr/>
<h3>Пример использования</h3>
<h4>Круговая диаграмма:</h4>
<pre>
var myGraph = new Graph ({
      el:    'body',
      width:  300,
      height: 300
});

var svgSectors = myGraph.renderCircleDiagram([2, 5, 7, 3, 5]);
</pre>

<h4>Линейный график:</h4>
<pre>
var lineGraph = new Graph ({
      el:    'body',
});
lineGraph.renderShape([2, 5, 7, 3, 5]);
lineGraph.renderLine([2, 5, 7, 3, 5]);
lineGraph.renderPoints([2, 5, 7, 3, 5]);
lineGraph.renderPointsValues([2, 5, 7, 3, 5]);
</pre>

<h4>Столбцовая диаграмма:</h4>
<pre>
var rectGraph = new Graph ({
      el:    'body',
});
rectGraph.renderVerticalGreed([2, 5, 7, 3, 5]);
rectGraph.renderDiagram([2, 5, 7, 3, 5]);
rectGraph.renderRectsValues([2, 5, 7, 3, 5]);
</pre>


