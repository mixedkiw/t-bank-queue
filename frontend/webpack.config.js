const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
	entry: './src/index.js',
	output: {
		filename: 'bundle.js',
		path: path.join(__dirname, './dist'),
	},
	module: {
		rules: [
			{
				test: /\.js$/,
				exclude: /node_modules/,
				use: {
					loader: 'babel-loader',
				},
			},
			{ test: /\.css$/, use: ['style-loader', 'css-loader'] },
			{
				test: /\.(jpg|png|gif)$/,
				use: [
					{
						loader: 'file-loader',
						options: {
							name: '[name].[ext]',
							outputPath: './',
							useRelativePath: true,
						},
					},
				],
			},
		],
	},

	plugins: [new HtmlWebpackPlugin({ template: './src/index.html' })],
}
