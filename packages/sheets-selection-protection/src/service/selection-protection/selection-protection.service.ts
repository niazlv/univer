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

import type { Workbook } from '@univerjs/core';
import { Disposable, IPermissionService, IResourceManagerService, IUniverInstanceService, LifecycleStages, OnLifecycle } from '@univerjs/core';
import { INTERCEPTOR_POINT, SheetInterceptorService } from '@univerjs/sheets';
import { Inject } from '@wendellhu/redi';
import { UniverType } from '@univerjs/protocol';
import { SelectionProtectionRuleModel } from '../../model/selection-protection-rule.model';
import { type IObjectModel, type ISelectionProtectionRule, UnitObject } from '../../model/type';
import { PLUGIN_NAME } from '../../base/const';
import type { IAllowedRequest } from '../selection-permission-io/type';
import { defaultRangeActions, defaultSheetActions, ISelectionPermissionIoService } from '../selection-permission-io/type';
import { SelectionProtectionRenderModel } from '../../model/selection-protection-render.model';
import type { ISelectionProtectionRenderCellData } from '../../render/type';
import { getAllPermissionPoint } from './permission-point';

@OnLifecycle(LifecycleStages.Starting, SelectionProtectionService)
export class SelectionProtectionService extends Disposable {
    constructor(
        @Inject(SelectionProtectionRuleModel) private _selectionProtectionRuleModel: SelectionProtectionRuleModel,
        @Inject(IPermissionService) private _permissionService: IPermissionService,
        @Inject(IResourceManagerService) private _resourceManagerService: IResourceManagerService,
        @Inject(ISelectionPermissionIoService) private _selectionPermissionIoService: ISelectionPermissionIoService,
        @Inject(SheetInterceptorService) private _sheetInterceptorService: SheetInterceptorService,
        @Inject(SelectionProtectionRenderModel) private _selectionProtectionRenderModel: SelectionProtectionRenderModel,
        @Inject(IUniverInstanceService) private _univerInstanceService: IUniverInstanceService

    ) {
        super();
        this._initSnapshot();
        this._initRuleChange();
        this._initViewModelInterceptor();
    }

    private _initViewModelInterceptor() {
        this.disposeWithMe(this._sheetInterceptorService.intercept(INTERCEPTOR_POINT.CELL_CONTENT, {
            handler: (cell = {}, context, next) => {
                const { unitId, subUnitId, row, col } = context;
                const permissionList = this._selectionProtectionRenderModel.getCellInfo(unitId, subUnitId, row, col)
                    .filter((p) => !!p.ruleId)
                    .map((p) => {
                        const rule = this._selectionProtectionRuleModel.getRule(unitId, subUnitId, p.ruleId!) || {} as ISelectionProtectionRule;
                        return {
                            ...p, ranges: rule.ranges!,
                        };
                    })
                    .filter((p) => !!p.ranges);
                if (permissionList.length) {
                    const _cellData: ISelectionProtectionRenderCellData = { ...cell, selectionProtection: permissionList };
                    return next(_cellData);
                }
                return next(cell);
            },
        }
        ));
    }

    private _initRuleChange() {
        this.disposeWithMe(
            this._selectionProtectionRuleModel.ruleChange$.subscribe((info) => {
                this._selectionPermissionIoService.allowed({
                    permissionId: info.rule.permissionId,
                    permissionType: info.rule.unitType,
                    unitId: info.unitId,
                    actions: info.rule.unitType === UnitObject.SelectRange ? defaultRangeActions : defaultSheetActions,
                }).then((permissionMap) => {
                    Object.keys(permissionMap).forEach((permissionId) => {
                        getAllPermissionPoint().forEach((F) => {
                            const rule = info.rule;
                            const instance = new F(rule.unitId, rule.subUnitId, permissionId);
                            if (permissionMap[instance.subType] !== undefined) {
                                this._permissionService.updatePermissionPoint(instance.id, permissionMap[instance.subType]);
                            }
                        });
                    });
                });

                switch (info.type) {
                    case 'add': {
                        getAllPermissionPoint().forEach((F) => {
                            const instance = new F(info.unitId, info.subUnitId, info.rule.permissionId);
                            this._permissionService.addPermissionPoint(instance);
                        });
                        break;
                    }
                    case 'delete': {
                        getAllPermissionPoint().forEach((F) => {
                            const instance = new F(info.unitId, info.subUnitId, info.rule.permissionId);
                            this._permissionService.deletePermissionPoint(instance.id);
                        });
                        break;
                    }
                    case 'set': {
                        getAllPermissionPoint().forEach((F) => {
                            const oldPermissionPoint = new F(info.unitId, info.subUnitId, info.oldRule!.permissionId);
                            this._permissionService.deletePermissionPoint(oldPermissionPoint.id);
                            const newPermissionPoint = new F(info.unitId, info.subUnitId, info.rule.permissionId);
                            this._permissionService.addPermissionPoint(newPermissionPoint);
                        });
                        break;
                    }
                }
            }));
    }


    private _initSnapshot() {
        const toJson = (unitID: string) => {
            const object = this._selectionProtectionRuleModel.toObject();
            const v = object[unitID];
            return v ? JSON.stringify(v) : '';
        };
        const parseJson = (json: string): IObjectModel[keyof IObjectModel] => {
            if (!json) {
                return {};
            }
            try {
                return JSON.parse(json);
            } catch (err) {
                return {};
            }
        };
        this.disposeWithMe(
            this._resourceManagerService.registerPluginResource({
                toJson, parseJson,
                pluginName: PLUGIN_NAME,
                businesses: [UniverType.UNIVER_SHEET],
                onLoad: (unitId, resources) => {
                    const result = this._selectionProtectionRuleModel.toObject();
                    result[unitId] = resources;
                    this._selectionProtectionRuleModel.fromObject(result);
                    const allAllowedParams: IAllowedRequest[] = [];
                    Object.keys(resources).forEach((subUnitId) => {
                        const list = resources[subUnitId];

                        this._selectionProtectionRuleModel.getSubunitRuleList(unitId, subUnitId).forEach((rule) => {
                            allAllowedParams.push({
                                permissionId: rule.permissionId,
                                permissionType: rule.unitType,
                                unitId,
                                actions: rule.unitType === UnitObject.SelectRange ? defaultRangeActions : defaultSheetActions,
                            });
                        });


                        list.forEach((rule) => {
                            getAllPermissionPoint().forEach((Factor) => {
                                const instance = new Factor(unitId, subUnitId, rule.permissionId);
                                this._permissionService.addPermissionPoint(instance);
                            });
                        });
                    });

                    this._selectionPermissionIoService.batchAllowed(allAllowedParams).then((permissionMap) => {
                        const workbook = this._univerInstanceService.getCurrentUnitForType<Workbook>(UniverType.UNIVER_SHEET)!;
                        const allSheets = workbook.getSheets();
                        const permissionIdWithRuleInstanceMap = new Map();
                        allSheets.forEach((sheet) => {
                            const permissionList = this._selectionProtectionRuleModel.getSubunitRuleList(unitId, sheet.getSheetId());
                            permissionList.forEach((rule) => {
                                permissionIdWithRuleInstanceMap.set(rule.permissionId, rule);
                            });
                        });
                        Object.keys(permissionMap).forEach((permissionId) => {
                            const result = permissionMap[permissionId]; // Record<IPermissionSubType, boolean>
                            getAllPermissionPoint().forEach((F) => {
                                const rule = permissionIdWithRuleInstanceMap.get(permissionId);
                                if (rule) {
                                    const instance = new F(unitId, rule.subUnitId, permissionId);
                                    if (result[instance.subType] !== undefined) {
                                        this._permissionService.updatePermissionPoint(instance.id, result[instance.subType]);
                                    }
                                }
                            });
                        });
                    });
                },
                onUnLoad: (unitId) => {
                    this._selectionProtectionRuleModel.deleteUnitModel(unitId);
                },
            })
        );
    }
}

