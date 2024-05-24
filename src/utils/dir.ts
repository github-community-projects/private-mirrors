import tempy from 'tempy'

// FIXME: Had to downgrade tempy to not use esm
export const temporaryDirectory = () => tempy.directory()
