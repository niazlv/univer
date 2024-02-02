/**
 * Copyright 2023-present DreamNum Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type { IRange, IScale } from '@univerjs/core';
import { Range } from '@univerjs/core';
import type { SpreadsheetSkeleton, UniverRenderingContext } from '@univerjs/engine-render';
import { SheetExtension } from '@univerjs/engine-render';
import type { IDataBarCellData } from './type';

export const dataBarUKey = 'sheet-conditional-rule-data-bar';
const EXTENSION_Z_INDEX = 125;

export class DataBar extends SheetExtension {
    override uKey = dataBarUKey;

    override zIndex = EXTENSION_Z_INDEX;
    _radius = 2;
    override draw(
        ctx: UniverRenderingContext,
        parentScale: IScale,
        spreadsheetSkeleton: SpreadsheetSkeleton,
        diffRanges?: IRange[]
    ) {
        const { rowHeightAccumulation, columnWidthAccumulation, worksheet, dataMergeCache } =
        spreadsheetSkeleton;
        if (!worksheet) {
            return false;
        }
        Range.foreach(spreadsheetSkeleton.rowColumnSegment, (row, col) => {
            const cellData = worksheet.getCell(row, col) as IDataBarCellData;
            if (cellData && cellData.dataBar) {
                const { color, value, startPoint } = cellData.dataBar;
                const cellInfo = this.getCellIndex(row, col, rowHeightAccumulation, columnWidthAccumulation, dataMergeCache);
                let { isMerged, isMergedMainCell, mergeInfo, startY, endY, startX, endX } = cellInfo;
                if (isMerged) {
                    return;
                }
                if (isMergedMainCell) {
                    startY = mergeInfo.startY;
                    endY = mergeInfo.endY;
                    startX = mergeInfo.startX;
                    endX = mergeInfo.endX;
                }
                if (!this.isRenderDiffRangesByCell(mergeInfo, diffRanges)) {
                    return;
                }
                const borderWidth = endX - startX;
                const borderHeight = endY - startY;
                const paddingRightAndLeft = 2;
                const paddingTopAndBottom = 2;
                const width = borderWidth - paddingRightAndLeft * 2;
                const height = borderHeight - paddingTopAndBottom * 2;
                ctx.save();
                ctx.beginPath();
                ctx.fillStyle = color;
                if (value > 0) {
                    const dataBarWidth = width * (1 - startPoint / 100) * value / 100;
                    this._drawRectWithRoundedCorner(ctx, startX + paddingRightAndLeft + (startPoint / 100) * width, startY + paddingTopAndBottom, dataBarWidth, height, false, true, true, false);
                } else {
                    const dataBarWidth = width * startPoint / 100 * Math.abs(value) / 100;
                    this._drawRectWithRoundedCorner(ctx, startX + paddingRightAndLeft + (startPoint / 100) * width - dataBarWidth, startY + paddingTopAndBottom, dataBarWidth, height, true, false, false, true);
                }
                ctx.restore();
            }
        });
    }

    private _drawRectWithRoundedCorner(ctx: UniverRenderingContext, x: number, y: number, width: number, height: number, topLeftRadius: boolean, topRightRadius: boolean, bottomRightRadius: boolean, bottomLeftRadius: boolean) {
        const radius = this._radius;
        if (!height || !width) {
            return;
        }
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        if (topRightRadius) {
            ctx.arcTo(x + width, y, x + width, y + radius, radius);
        } else {
            ctx.lineTo(x + width, y);
        }
        ctx.lineTo(x + width, y + height - radius);
        if (bottomRightRadius) {
            ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
        } else {
            ctx.lineTo(x + width, y + height);
        }
        ctx.lineTo(x + radius, y + height);
        if (bottomLeftRadius) {
            ctx.arcTo(x, y + height, x, y + height - radius, radius);
        } else {
            ctx.lineTo(x, y + height);
        }
        ctx.lineTo(x, y + radius);
        if (topLeftRadius) {
            ctx.arcTo(x, y, x + radius, y, radius);
        } else {
            ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
    }
}