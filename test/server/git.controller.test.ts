import { fetchExclusionConfig } from '../../src/server/git/controller'
import fs from 'fs'
import path from 'path'

jest.mock('fs')
jest.mock('path')

describe('fetchExclusionConfig', () => {
  const repoPath = '/fake/repo/path'
  const configPath = '/fake/repo/path/.syncignore'

  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('should return exclusion paths when .syncignore file exists', async () => {
    const mockContent = 'path/to/exclude1\npath/to/exclude2\n'
    jest.spyOn(fs, 'existsSync').mockReturnValue(true)
    jest.spyOn(fs, 'readFileSync').mockReturnValue(mockContent)
    jest.spyOn(path, 'join').mockReturnValue(configPath)

    const result = await fetchExclusionConfig(repoPath)
    expect(result).toEqual(['path/to/exclude1', 'path/to/exclude2'])
    expect(fs.existsSync).toHaveBeenCalledWith(configPath)
    expect(fs.readFileSync).toHaveBeenCalledWith(configPath, 'utf-8')
  })

  it('should return an empty array when .syncignore file does not exist', async () => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(false)
    jest.spyOn(path, 'join').mockReturnValue(configPath)

    const result = await fetchExclusionConfig(repoPath)
    expect(result).toEqual([])
    expect(fs.existsSync).toHaveBeenCalledWith(configPath)
    expect(fs.readFileSync).not.toHaveBeenCalled()
  })

  it('should return an empty array when .syncignore file is empty', async () => {
    const mockContent = ''
    jest.spyOn(fs, 'existsSync').mockReturnValue(true)
    jest.spyOn(fs, 'readFileSync').mockReturnValue(mockContent)
    jest.spyOn(path, 'join').mockReturnValue(configPath)

    const result = await fetchExclusionConfig(repoPath)
    expect(result).toEqual([])
    expect(fs.existsSync).toHaveBeenCalledWith(configPath)
    expect(fs.readFileSync).toHaveBeenCalledWith(configPath, 'utf-8')
  })
})
