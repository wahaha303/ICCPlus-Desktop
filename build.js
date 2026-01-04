const path = require('path');
require('dotenv').config();

module.exports = {
	productName: 'ICC Plus 2',
	appId: 'com.iccplus.app',
	files: [
		'js/**/*',
		'css/**/*',
		'fonts/**/*',
		'main.js',
		'preload.js',
		'server.js',
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
		perMachine: true,
		runAfterFinish: false
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
