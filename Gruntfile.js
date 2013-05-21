module.exports = function (grunt) {

    /**
     * Настройки
     */
    grunt.initConfig({

        /**
         * Минификация JS
         */
        uglify: {
            options: {
                compress: true,
                report:   false
            },
            js: {
                'src':  'source/*.js',
                'dest': 'graph.min.js'
            }
        },


        /**
         * Архивирование JS
         */
        compress: {
            js: {
                options: {
                    archive: 'graph.zip'
                },
                src: [
                    'graph.min.js',
                    'graph.css',
                    'sample.html'
                ],
                dest:    './'
            }
        },


        /**
         * Автосборка по изменению файла
         */
        watch: {
            files: [
                'source/*.js',
                '*.{html,css}'
            ],
            tasks: [
                'uglify',
                'compress'
            ],
            options: {
                nospawn: true
            }
        }
    });

    /**
     * Используемые модули
     */
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-compress');
    grunt.loadNpmTasks('grunt-contrib-watch');

    /**
     * Сборка JS-интерфейса
     */
    grunt.registerTask('default', [
        'uglify', 'compress', 'watch'
    ]);
};
