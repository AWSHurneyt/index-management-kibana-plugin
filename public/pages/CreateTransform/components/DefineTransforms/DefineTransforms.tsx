/*
 * Copyright 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License").
 * You may not use this file except in compliance with the License.
 * A copy of the License is located at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * or in the "license" file accompanying this file. This file is distributed
 * on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied. See the License for the specific language governing
 * permissions and limitations under the License.
 */

import { EuiDataGrid, EuiDataGridColumn, EuiEmptyPrompt, EuiSpacer, EuiText } from "@elastic/eui";
import { CoreStart } from "kibana/public";
import React, { useCallback, useState } from "react";
import { ContentPanel } from "../../../../components/ContentPanel";
import { FieldItem, GROUP_TYPES, TransformGroupItem } from "../../../../../models/interfaces";
import { TransformService } from "../../../../services";
import { getErrorMessage } from "../../../../utils/helpers";
import { isNumericMapping } from "../../utils/helpers";

interface DefineTransformsProps {
  transformService: TransformService;
  notifications: CoreStart["notifications"];
  transformId: string;
  sourceIndex: string;
  fields: FieldItem[];
  selectedGroupField: TransformGroupItem[];
  onGroupSelectionChange: (selectedFields: TransformGroupItem[]) => void;
  selectedAggregations: any;
  onAggregationSelectionChange: (selectedFields: any) => void;
  previewTransform: any[];
}

export default function DefineTransforms({
  transformService,
  notifications,
  transfromId,
  sourceIndex,
  fields,
  selectedGroupField,
  onGroupSelectionChange,
  selectedAggregations,
  onAggregationSelectionChange,
  previewTransform,
}: DefineTransformsProps) {
  let columns: EuiDataGridColumn[] = [];

  const [previewColumns, setPreviewColumns] = useState<EuiDataGridColumn[]>([]);

  const updatePreviewColumns = (): void => {
    // setPreviewColumns([{id: "ex-col"}]);
    // setPreviewColumns([]);
    if (previewTransform.length) {
      let tempCol: EuiDataGridColumn[] = [];
      for (const [key, value] of Object.entries(previewTransform[0])) {
        tempCol.push({
          id: key,
          displayAsText: key,
          actions: {
            showHide: false,
            showMoveLeft: false,
            showMoveRight: false,
            showSortAsc: false,
            showSortDesc: false,
          },
        });
      }
      setPreviewColumns(tempCol);
      setVisiblePreviewColumns(() => tempCol.map(({ id }) => id).slice(0, 5));
    }
    //Debug use
    console.log("Preview columns: " + JSON.stringify(previewColumns));
  };

  fields.map((field: FieldItem) => {
    const isNumeric = isNumericMapping(field.type);
    const isDate = field.type == "date";

    // TODO: Handle the available options according to column types
    columns.push({
      id: field.label,
      displayAsText: field.label + " type: " + field.type,
      schema: field.type,
      actions: {
        showHide: false,
        showMoveLeft: false,
        showMoveRight: false,
        showSortAsc: false,
        showSortDesc: false,
        additional: [
          {
            label: "Group by histogram ",
            onClick: () => {
              const targetFieldName = `${field.label}_${GROUP_TYPES.histogram}`;
              groupSelection.push({
                histogram: {
                  source_field: field.label,
                  target_field: targetFieldName,
                  interval: 5,
                },
              });
              onGroupSelectionChange(groupSelection);
              previewColumns.push({
                id: targetFieldName,
              });
            },
            size: "xs",
            color: isNumeric ? "text" : "subdued",
          },
          {
            label: "Group by date histogram ",
            onClick: () => {
              groupSelection.push({
                date_histogram: {
                  source_field: field.label,
                  target_field: `${field.label}_${GROUP_TYPES.dateHistogram}`,
                  calendar_interval: "1d",
                },
              });
              onGroupSelectionChange(groupSelection);
            },
            size: "xs",
            color: isDate ? "text" : "subdued",
          },
          {
            label: "Group by terms ",
            onClick: () => {
              groupSelection.push({
                terms: {
                  source_field: field.label,
                  target_field: `${field.label}_${GROUP_TYPES.terms}`,
                },
              });
              onGroupSelectionChange(groupSelection);
            },
            size: "xs",
            color: "text",
          },
          {
            label: "Aggregate by sum ",
            onClick: () => {
              aggSelection[`sum_${field.label}`] = {
                sum: { field: field.label },
              };
              onAggregationSelectionChange(aggSelection);
              console.log(Object.entries(selectedAggregations));
            },
            size: "xs",
            color: "text",
          },
          {
            label: "Aggregate by max ",
            onClick: () => {
              aggSelection[`max_${field.label}`] = {
                max: { field: field.label },
              };
              onAggregationSelectionChange(aggSelection);
            },
            size: "xs",
            color: "text",
          },
          {
            label: "Aggregate by min ",
            onClick: () => {
              aggSelection[`min_${field.label}`] = {
                min: { field: field.label },
              };
              onAggregationSelectionChange(aggSelection);
            },
            size: "xs",
            color: "text",
          },
          {
            label: "Aggregate by avg ",
            onClick: () => {
              aggSelection[`avg_${field.label}`] = {
                avg: { field: field.label },
              };
              onAggregationSelectionChange(aggSelection);
            },
            size: "xs",
            color: "text",
          },
          {
            label: "Aggregate by count ",
            onClick: () => {
              aggSelection[`count_${field.label}`] = {
                count: { field: field.label },
              };
              onAggregationSelectionChange(aggSelection);
            },
            size: "xs",
            color: "text",
          },
          {
            label: "Aggregate by percentile",
            onClick: () => {
              aggSelection[`percentiles_${field.label}`] = {
                percentiles: { field: field.label, percents: [1, 5, 25, 99] },
              };
              onAggregationSelectionChange(aggSelection);
            },
            size: "xs",
            color: "text",
          },
          {
            label: "Aggregate by scripted metrics ",
            onClick: () => {
              aggSelection[`scripted_metric_${field.label}`] = {
                scripted_metric: {
                  init_script: "",
                  map_script: "",
                  combine_script: "",
                  reduce_script: "",
                },
              };
              onAggregationSelectionChange(aggSelection);
            },
            size: "xs",
            color: "text",
          },
        ],
      },
    });
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [from, setFrom] = useState<number>(0);
  const [size, setSize] = useState<number>(10);
  const [sortingColumns, setSortingColumns] = useState([]);
  const [visibleColumns, setVisibleColumns] = useState(() => columns.map(({ id }) => id).slice(0, 5));
  const [visiblePreviewColumns, setVisiblePreviewColumns] = useState(() => previewColumns.map(({ id }) => id).slice(0, 5));
  const [data, setData] = useState([]);
  const [dataCount, setDataCount] = useState<number>(0);
  const [groupSelection, setGroupSelection] = useState<TransformGroupItem[]>(selectedGroupField);
  const [aggSelection, setAggSelection] = useState(selectedAggregations);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await transformService.searchSampleData(sourceIndex, { from, size });

      if (response.ok) {
        setData(response.response.data);
        setDataCount(response.response.total.value);
      }
    } catch (err) {
      notifications.toasts.addDanger(getErrorMessage(err, "There was a problem loading the rollups"));
    }
    setLoading(false);
  }, [sourceIndex]);

  React.useEffect(() => {
    fetchData();
  }, []);

  React.useEffect(() => {
    updatePreviewColumns();
  }, [previewTransform]);

  const onChangeItemsPerPage = useCallback(
    (pageSize) => {
      setPagination((pagination) => ({
        ...pagination,
        pageSize,
        pageIndex: 0,
      }));
      setFrom(0);
      setSize(pageSize);
    },
    [setPagination]
  );
  const onChangePage = useCallback(
    (pageIndex) => {
      setPagination((pagination) => ({ ...pagination, pageIndex }));
      setFrom(pageIndex * size);
    },
    [setPagination]
  );

  const onSort = useCallback(
    (sortingColumns) => {
      setSortingColumns(sortingColumns);
    },
    [setSortingColumns]
  );

  const renderCellValue = ({ rowIndex, columnId }) => {
    if (!loading && data.hasOwnProperty(rowIndex)) {
      // TODO: work on truncating the value to certain length defined by the keyword field
      if (columns?.find((column) => column.id == columnId).schema == "keyword") {
        // Strip off the keyword postfix
        const correspondingTextColumnId = columnId.replace(".keyword", "");
        return data[rowIndex]._source[correspondingTextColumnId] ? data[rowIndex]._source[correspondingTextColumnId] : "-";
      }
      return data[rowIndex]._source[columnId] ? data[rowIndex]._source[columnId] : "-";
    }
    return "-";
  };

  const renderPreviewCellValue = ({ rowIndex, columnId }) => {
    if (previewTransform.hasOwnProperty(rowIndex)) {
      return previewTransform[rowIndex][columnId] ? previewTransform[rowIndex][columnId] : "-";
    }
    return "-";
  };

  return (
    <ContentPanel
      //TODO: Add action to enter full screen view
      // actions={
      //   <ContentPanelActions
      //     actions={[
      //       {
      //         text: "Full screen view",
      //         buttonProps: {
      //           iconType: "fullScreen",
      //           // onClick: () =>
      //           //   onShow(ApplyPolicyModal, {
      //           //     indices: selectedItems.map((item: ManagedCatIndex) => item.index),
      //           //     core: this.context,
      //           //   }),
      //         },
      //       },
      //     ]}
      //   />
      // }
      bodyStyles={{ padding: "10px 10px" }}
      title="Select fields to transform"
      titleSize="m"
    >
      <EuiText>
        <h4>Original fields with sample data</h4>
      </EuiText>
      <EuiSpacer size="s" />
      {/*TODO: Substitute "source index", and "filtered by" fields with actual values*/}
      <EuiText color="subdued" size="xs">
        <p>{`Viewing sample data from index ${sourceIndex}`}</p>
      </EuiText>
      <EuiSpacer size="s" />
      {/*TODO: add rowCount*/}
      <EuiDataGrid
        aria-label="Define transforms"
        columns={columns}
        columnVisibility={{ visibleColumns, setVisibleColumns }}
        rowCount={Math.min(dataCount, 200)}
        renderCellValue={renderCellValue}
        sorting={{ columns: sortingColumns, onSort }}
        pagination={{
          ...pagination,
          pageSizeOptions: [5, 10, 20, 50],
          onChangeItemsPerPage: onChangeItemsPerPage,
          onChangePage: onChangePage,
        }}
        toolbarVisibility={{
          showColumnSelector: true,
          showStyleSelector: false,
          showSortSelector: false,
          showFullScreenSelector: false,
        }}
      />
      <EuiSpacer />
      <EuiText>
        <h4>Transformed fields preview based on sample data</h4>
      </EuiText>
      {previewTransform.length ? (
        <EuiDataGrid
          aria-label="Preview transforms"
          columns={previewColumns}
          columnVisibility={{ visibleColumns: visiblePreviewColumns, setVisibleColumns: setVisiblePreviewColumns }}
          rowCount={previewTransform.length}
          renderCellValue={renderPreviewCellValue}
          // sorting={{ columns: sortingColumns, onSort }}
          // pagination={{
          //   ...pagination,
          //   pageSizeOptions: [5, 10, 20, 50],
          //   onChangeItemsPerPage: onChangeItemsPerPage,
          //   onChangePage: onChangePage,
          // }}
          toolbarVisibility={{
            showColumnSelector: true,
            showStyleSelector: false,
            showSortSelector: false,
            showFullScreenSelector: false,
          }}
        />
      ) : (
        <EuiEmptyPrompt
          title={<h3> No fields selected</h3>}
          body={<p>From the table above, select a field you want to transform by clicking the “plus” button next to the field name</p>}
        />
      )}
    </ContentPanel>
  );
}
