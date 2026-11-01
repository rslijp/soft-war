// webpack.config.js

const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");

const ERROR_PAGES = [
    {
        filename: "401.html", code: "401", cssCode: "401",
        heading: "Oops! You are not allowed",
        banner: "<span>4</span><span>0</span><span>1</span>",
        message: "Sorry, you don't have access to the page you requested"
    },
    {
        filename: "403.html", code: "403", cssCode: "403",
        heading: "Oops! You are not allowed",
        banner: "<span>4</span><span>0</span><span>3</span>",
        message: "Sorry, you don't have access to the page you requested"
    },
    {
        filename: "404.html", code: "404", cssCode: "404",
        heading: "Oops! Page not found",
        banner: "<span>4</span><span>0</span><span>4</span>",
        message: "Sorry, the page you requested was not found"
    },
    {
        filename: "50x.html", code: "500", cssCode: "500",
        heading: "Oops! You hit an error",
        banner: "<span>O</span><span>O</span>P<span>S</span>",
        message: "we are sorry, please"
    }
];

const config = {
    entry: {
        main: "./src/index.js",
        // the map on the sign-in page (public/auth)
        login: "./src/login.js"
    },
    watch: false,
    output: {
        filename: "[name].js",
        path: path.resolve(__dirname, "..", "backend", "public"),
    },
    module: {
        // exclude node_modules
        rules: [
            {
                test: /\.css$/i,
                use: ['style-loader', 'css-loader'],
            },
            {
                test: /\.(js|jsx)$/,         // <-- added `|jsx` here
                exclude: /node_modules/,
                use: ["babel-loader"],
            },
        ],
    },
    // pass all js files through Babel
    resolve: {
        extensions: ["*", ".js", ".jsx"],    // <-- added `.jsx` here
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: path.join(__dirname, "public", "index.html"),
            chunks: ["main"]
        }),
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: path.resolve(__dirname, 'favicon.ico'),
                    to: '[path]/[name][ext]'
                },
                {
                    from: path.resolve(__dirname, 'content/**/*'),
                    to: '[path]/[name][ext]'
                },
                {
                    from: path.resolve(__dirname, 'public/about/**/*'),
                    to: '[path]/[name][ext]'
                },
                {
                    from: path.resolve(__dirname, 'public/auth/**/*'),
                    to: '[path]/[name][ext]'
                }]
        }),
        ...ERROR_PAGES.map(page => new HtmlWebpackPlugin({
            template: path.join(__dirname, "src", "error-page.html"),
            filename: page.filename,
            templateParameters: page,
            inject: false,
            minify: false
        }))
    ]
}

module.exports = (env, argv) => {
    if (argv.mode === 'development') {
        console.log("WATCHING");
        config.watch=true;
        config.output.path=path.resolve(__dirname, "..", "backend", "public");
    }
    return config;
};