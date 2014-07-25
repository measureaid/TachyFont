'use strict';

/*
 * Copyright 2014 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

/**
 * Binary operation over font file or glyph bundle
 * Always big endian byte order
 * @param {type} dataView DataView which includes data
 * @param {type} baseOffset Set this offset as 0 offset for operations
 * @constructor
 */
function BinaryFontEditor(dataView, baseOffset) {
    this.dataView = dataView;
    this.baseOffset = baseOffset;
    this.offset = 0;
}

/**
 * @return {number} Unsigned byte
 * @private
 */
BinaryFontEditor.prototype.getUint8_ = function() {
    var data = this.dataView.getUint8(this.baseOffset + this.offset);
    this.offset++;
    return data;
};

/**
 * @param {number} data Unsigned byte
 * @private
 */
BinaryFontEditor.prototype.setUint8_ = function(data) {
    this.dataView.setUint8(this.baseOffset + this.offset, data);
    this.offset++;
};

/**
 * @return {number} Signed byte
 * @private
 */
BinaryFontEditor.prototype.getInt8_ = function() {
    var data = this.dataView.getInt8(this.baseOffset + this.offset);
    this.offset++;
    return data;
};

/**
 * @param {number} data Unsigned byte
 * @private
 */
BinaryFontEditor.prototype.setInt8_ = function(data) {
    this.dataView.setInt8(this.baseOffset + this.offset, data);
    this.offset++;
};

/**
 * @return {number} Unsigned short
 * @private
 */
BinaryFontEditor.prototype.getUint16_ = function() {
    var data = this.dataView.getUint16(this.baseOffset + this.offset);
    this.offset += 2;
    return data;
};

/**
 * @param {number} data Unsigned short
 * @private
 */
BinaryFontEditor.prototype.setUint16_ = function(data) {
    this.dataView.setUint16(this.baseOffset + this.offset, data);
    this.offset += 2;
};

/**
 * @return {number} Signed short
 * @private
 */
BinaryFontEditor.prototype.getInt16_ = function() {
    var data = this.dataView.getInt16(this.baseOffset + this.offset);
    this.offset += 2;
    return data;
};

/**
 * @param {number} data Signed short
 * @private
 */
BinaryFontEditor.prototype.setInt16_ = function(data) {
    this.dataView.setInt16(this.baseOffset + this.offset, data);
    this.offset += 2;
};

/**
 * @return {number} Unsigned integer
 * @private
 */
BinaryFontEditor.prototype.getUint32_ = function() {
    var data = this.dataView.getUint32(this.baseOffset + this.offset);
    this.offset += 4;
    return data;
};

/**
 * @param {number} data Unsigned integer
 * @private
 */
BinaryFontEditor.prototype.setUint32_ = function(data) {
    this.dataView.setUint32(this.baseOffset + this.offset, data);
    this.offset += 4;
};

/**
 * @return {number} Signed integer
 * @private
 */
BinaryFontEditor.prototype.getInt32_ = function() {
    var data = this.dataView.getInt32(this.baseOffset + this.offset);
    this.offset += 4;
    return data;
};

/**
 * @param {number} data Signed integer
 * @private
 */
BinaryFontEditor.prototype.setInt32_ = function(data) {
    this.dataView.setInt32(this.baseOffset + this.offset, data);
    this.offset += 4;
};

/**
 * @param {function()} getter One of getUint or getInt functions
 * @param {number} count Size of array
 * @return {Array.<number>}
 * @private
 */
BinaryFontEditor.prototype.getArrayOf_ = function(getter, count) {
    var arr = [];
    for (var i = 0; i < count; i++) {
        arr.push(getter.call(this));
    }
    return arr;
};

/**
 * @param {function(number)} setter One of setUint or setInt functions
 * @param {Array.<number>} arr
 * @private
 */
BinaryFontEditor.prototype.setArrayOf_ = function(setter, arr) {
    var count = arr.length;
    for (var i = 0; i < count; i++) {
        setter.call(this, arr[i]);
    }
};

/**
 * @param {number} offSize Number of bytes in offset
 * @return {number} Offset
 * @private
 */
BinaryFontEditor.prototype.getOffset_ = function(offSize) {
  var offset;
  switch (offSize) {
      case 1:
          offset = this.getUint8_();
          break;
      case 2:
          offset = this.getUint16_();
          break;
      case 3:
          offset = this.getUint32_() >>> 8;
          this.offset--;
          break;
      case 4:
          offset = this.getUint32_();
          break;
  }
  return offset;
};

/**
 * @param {number} offSize Number of bytes in offset
 * @param {number} value Offset value
 * @private
 */
BinaryFontEditor.prototype.setOffset_ = function(offSize, value) {
  switch (offSize) {
      case 1:
          this.setUint8_(value);
          break;
      case 2:
          this.setUint16_(value);
          break;
      case 3:
          this.setUint16_(value >>> 8);
          this.setUint8_(value & 0xFF);
          break;
      case 4:
          this.setUint32_(value);
          break;
  }
};

/**
 * @param {number} length Length of the string
 * @return {string}
 * @private
 */
BinaryFontEditor.prototype.readString_ = function(length) {
    var str = '';
    for (var i = 0; i < length; i++) {
        str += String.fromCharCode(this.getUint8_());
    }
    return str;
};

/**
 * @param {number} newOffset
 */
BinaryFontEditor.prototype.seek = function(newOffset) {
    this.offset = newOffset;
};

/**
 * @return {number} current offset
 */
BinaryFontEditor.prototype.tell = function() {
    return this.offset;
};

/**
 * Magic used in header of the base font
 * BS:Brian Stell AC:Ahmet Celik :)
 * @type string
 */
BinaryFontEditor.magicHead = 'BSAC';

/**
 * Reading operations for the header
 * @type {Object}
 */
BinaryFontEditor.readOps = {};

/**
 * @param {BinaryFontEditor} editor Editor used to parse header
 * @param {IncrementalFontLoader} font Font loader object
 */
BinaryFontEditor.readOps.GLOF = function(editor, font) {
    font.glyphOffset = editor.getUint32_();
};

/**
 * @param {BinaryFontEditor} editor Editor used to parse header
 * @param {IncrementalFontLoader} font Font loader object
 */
BinaryFontEditor.readOps.GLCN = function(editor, font) {
    font.numGlyphs = editor.getUint16_();
};

/**
 * @param {BinaryFontEditor} editor Editor used to parse header
 * @param {IncrementalFontLoader} font Font loader object
 */
BinaryFontEditor.readOps.LCOF = function(editor, font) {
    font.glyphDataOffset = editor.getUint32_();
};

/**
 * @param {BinaryFontEditor} editor Editor used to parse header
 * @param {IncrementalFontLoader} font Font loader object
 */
BinaryFontEditor.readOps.LCFM = function(editor, font) {
    font.offsetSize = editor.getUint8_();
};

/**
 * @param {BinaryFontEditor} editor Editor used to parse header
 * @param {IncrementalFontLoader} font Font loader object
 */
BinaryFontEditor.readOps.HMOF = function(editor, font) {
    font.hmtxOffset = editor.getUint32_();
};

/**
 * @param {BinaryFontEditor} editor Editor used to parse header
 * @param {IncrementalFontLoader} font Font loader object
 */
BinaryFontEditor.readOps.VMOF = function(editor, font) {
    font.vmtxOffset = editor.getUint32_();
};

/**
 * @param {BinaryFontEditor} editor Editor used to parse header
 * @param {IncrementalFontLoader} font Font loader object
 */
BinaryFontEditor.readOps.HMMC = function(editor, font) {
    font.hmetricCount = editor.getUint16_();
};

/**
 * @param {BinaryFontEditor} editor Editor used to parse header
 * @param {IncrementalFontLoader} font Font loader object
 */
BinaryFontEditor.readOps.VMMC = function(editor, font) {
    font.vmetricCount = editor.getUint16_();
};

/**
 * Tags defined in the header of the basefont
 * @enum {Object}
 */
BinaryFontEditor.TAGS = {
    'GLOF':
            {'desc': 'Start of the glyphs data relative to font file start',
                'fn': BinaryFontEditor.readOps.GLOF
            },
    'GLCN':
            {'desc': 'Number of glyphs in the font',
                'fn': BinaryFontEditor.readOps.GLCN
            },
    'LCOF':
            {'desc': 'Start of glyph data location offsets',
                'fn': BinaryFontEditor.readOps.LCOF
            },
    'LCFM':
            {'desc': 'Offset size of the offsets in loca table',
                'fn': BinaryFontEditor.readOps.LCFM
            },
    'HMOF':
            {'desc': 'Start of the HMTX table relative to font file start',
                'fn': BinaryFontEditor.readOps.HMOF
            },
    'VMOF':
            {'desc': 'Start of the VMTX table relative to font file start',
                'fn': BinaryFontEditor.readOps.VMOF
            },
    'HMMC':
            {'desc': 'Number of hmetrics in hmtx table',
                'fn': BinaryFontEditor.readOps.HMMC
            },
    'VMMC':
            {'desc': 'Number of vmetrics in vmtx table',
                'fn': BinaryFontEditor.readOps.VMMC
            }
};

/**
 * Parse the header of the base font
 * Set information as attributes in given loader object
 * @return {Object} Results of parsing the header.
 */
BinaryFontEditor.prototype.parseBaseHeader = function() {
    var results = {};
    var magic = this.readString_(4);
    if (magic == BinaryFontEditor.magicHead) {
        var headerInfo = {};
        results.version = this.getInt32_();
        var count = this.getUint16_();
        var tags = [], tag, tagOffset, saveOffset,
                dataStart = count * 6 + 4 + 4 + 2 + 4;//magic,ver,count,headSize
        for (var i = 0; i < count; i++) {
            tag = this.readString_(4);
            tagOffset = this.getUint16_();
            if (!BinaryFontEditor.TAGS.hasOwnProperty(tag)) {//unknown tag
                throw 'Unknown Base Font Header TAG';
            }
            saveOffset = this.tell();
            this.seek(dataStart + tagOffset);
            BinaryFontEditor.TAGS[tag]['fn'](this, headerInfo);
            this.seek(saveOffset);
        }
        results.headerInfo = headerInfo;
        results.headSize = this.getInt32_();
    }
    return results;
};

/**
 * Sets side bearing in MTX tables
 * @param {number} start Beginning of MTX table
 * @param {number} metricCount Count of the metrics
 * @param {number} gid Glyph id
 * @param {number} value Side bearing value
 */
BinaryFontEditor.prototype.setMtxSideBearing = function(start, metricCount,
gid, value) {
    if (gid < metricCount) {
        this.seek(start + gid * 4 + 2);
        this.setInt16_(value);
    }else {
        this.seek(start + 2 * gid + 2 * metricCount);
        this.setInt16_(value);
    }
};

/**
 * Gets the glyph location for the given gid
 * @param {number} start Beginning of the glyph offsets(loca) table
 * @param {number} offSize Number of bytes in the offset
 * @param {number} gid Glyph id
 * @return {number} Offset
 */
BinaryFontEditor.prototype.getGlyphDataOffset = function(start, offSize, gid) {
    this.seek(start + gid * offSize);
    return this.getOffset_(offSize);
};

/**
 * Sets the glyph location for the given gid
 * @param {number} start Beginning of the glyph offsets(loca) table
 * @param {number} offSize Number of bytes in the offset
 * @param {number} gid Glyph id
 * @param {number} value New offset
 */
BinaryFontEditor.prototype.setGlyphDataOffset = function(start, offSize, gid,
value) {
    this.seek(start + gid * offSize);
    this.setOffset_(offSize, value);
};








