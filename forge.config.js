module.exports = {
  packagerConfig: {
    name: 'Pwd Note',
    // 暂时移除icon设置以解决打包问题
    // icon: 'assets/icon/pwd_note.png',
    asar: true,
    overwrite: true,
    ignore: [
      '\.git',
      '\.gitignore',
      'node_modules/\.cache',
      'package-lock\.json',
      'assets/source',
    ]
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'pwd_note',
        authors: 'Kydon',
        description: 'Pwd Note密码记事本',
        setupExe: 'PwdNoteSetup.exe',
        // 暂时移除setupIcon设置以解决打包问题
        // setupIcon: 'assets/icon/pwd_note.png',
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['win32', 'darwin', 'linux'],
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
  ],
};