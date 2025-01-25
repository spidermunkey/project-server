module.exports.Preset = (props) => {
  return {
      name: props?.name || 'untitled',
      // can be collection or icon preset,
      preset_for: props?.for || 'all',
      preset_type: props?.preset_type || 'collection',
      pid: props?.pid || uuid(),
      colors: props?.colors || [],
      viewbox: props?.viewbox || '',
      vbx: props?.vbx || 0,
      vby: props?.vby || 0,
      vbw: props?.vbw || 24,
      vbh: props?.vbh || 24,
      height: props?.height || '',
      width: props?.width || '',
      labels: props?.labels || '',
      created_at: props?.created_at || DateTime.stamp().ms,
  }
}
