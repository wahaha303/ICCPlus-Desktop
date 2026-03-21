const path = require('path');
require('dotenv').config();

module.exports = {
	productName: 'ICC Plus 2',
	executableName: 'icc-plus-2',
	appId: 'com.iccplus.app',
	artifactName: 'ICCPlus-Desktop-${version}-${os}-${arch}.${ext}',
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
		icon: 'assets/icons/icon.ico',
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
	linux: {
		category: 'Utility',
		target: [
			{
				target: 'AppImage',
				arch: [
					'x64'
				]
			},
			{
				target: 'tar.gz',
				arch: [
					'x64'
				]
			}
		],
		icon: 'assets/icons/icon.png'
	},
	mac: {
		icon: 'assets/icons/icon.icns'
	},
	icon: 'assets/icons/icon.png'
};
