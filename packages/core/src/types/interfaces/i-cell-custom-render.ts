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

import type { Nullable } from '../../shared';
import type { IStyleData } from './i-style-data';
import type { ICellData } from './i-cell-data';
import type { ISelectionCellWithCoord } from './i-selection-data';

export interface ICellRenderContext {
    data: ICellData;
    style: Nullable<IStyleData>;
    primaryWithCoord: ISelectionCellWithCoord;
    unitId?: string;
    subUnitId: string;
    row: number;
    col: number;
}

export interface ICellCustomRender {
    drawWith(ctx: CanvasRenderingContext2D, info: ICellRenderContext): void;
    zIndex?: number;
    isHit?: (info: ICellRenderContext) => boolean;
    onPointerDown?: (info: ICellRenderContext) => void;
    onPointerEnter?: (info: ICellRenderContext) => void;
    onPointerLeave?: (info: ICellRenderContext) => void;
}