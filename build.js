const path = require('path');
require('dotenv').config();

module.exports = {
	productName: 'ICC Plus 2',
	appId: 'com.iccplus.app',
	files: [
		'js/**/*',
		'css/**/*',
		'main.js',
		'preload.js',
		'index.html'
	],
	publish: [
		{
			provider: 'github',
			owner: 'wahaha303',
			repo: 'ICCPlus-Desktop',
			releaseType: "release"
		}
	],
	nsis: {
		oneClick: false,
		allowToChangeInstallationDirectory: true,
		perMachine: true
	},
	win: {
		verifyUpdateCodeSignature: true,
		target: [
			{
				target: 'nsis',
				arch: [
					'x64',
					'ia32'
				]
			}
		]
	},
	directories: {
		buildResources: 'assets'
	},
	icon: 'assets/icons/icon.ico'
};
