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

import { EuiDataGrid, EuiDataGridColumn, EuiSpacer, EuiText } from "@elastic/eui";
import { CoreStart } from "kibana/public";
import React, { useCallback, useState } from "react";
import { ContentPanel } from "../../../../components/ContentPanel";
import { FieldItem, GROUP_TYPES, TransformAggItem, TransformGroupItem } from "../../../../../models/interfaces";
import { TransformService } from "../../../../services";
import { getErrorMessage } from "../../../../utils/helpers";
import { isNumericMapping } from "../../utils/helpers";

interface DefineTransformsProps {
  transformService: TransformService;
  notifications: CoreStart["notifications"];
  transformId: string;
  sourceIndex: string;
  fields: FieldItem[];
  onGroupSelectionChange: (selectedFields: TransformGroupItem[]) => void;
  selectedAggregations: Map<string, TransformAggItem>;
  onAggregationSelectionChange: (selectedFields: Map<string, TransformAggItem>) => void;
}

export default function DefineTransforms({
  transformService,
  notifications,
  transfromId,
  sourceIndex,
  fields,
  onGroupSelectionChange,
  selectedAggregations,
  onAggregationSelectionChange,
}: DefineTransformsProps) {
  let columns: EuiDataGridColumn[] = [];

  fields.map((field: FieldItem) => {
    const isNumeric = isNumericMapping(field.type);
    const isDate = field.type == "date";
    // TODO: Handle the available options according to column types
    columns.push({
      id: field.label,
      displayAsText: field.label + " type: " + field.type,
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
              groupSelection.push({
                histogram: {
                  source_field: field.label,
                  target_field: `${field.label}_${GROUP_TYPES.histogram}`,
                  interval: 5,
                },
              });
              onGroupSelectionChange(groupSelection);
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
              aggSelection.set(`sum_${field.label}`, {
                sum: { field: field.label },
              });
              onAggregationSelectionChange(aggSelection);
            },
            size: "xs",
            color: "text",
          },
          {
            label: "Aggregate by max ",
            onClick: () => {
              aggSelection.set(`max_${field.label}`, {
                max: { field: field.label },
              });
              onAggregationSelectionChange(aggSelection);
            },
            size: "xs",
            color: "text",
          },
          {
            label: "Aggregate by min ",
            onClick: () => {
              aggSelection.set(`min_${field.label}`, {
                min: { field: field.label },
              });
              onAggregationSelectionChange(aggSelection);
            },
            size: "xs",
            color: "text",
          },
          {
            label: "Aggregate by avg ",
            onClick: () => {
              console.log("Before set: " + JSON.stringify(aggSelection));
              aggSelection.set("AVG", {
                avg: { field: field.label },
              });
              console.log("After set: " + JSON.stringify(aggSelection.get("AVG")));
              onAggregationSelectionChange(aggSelection);
            },
            size: "xs",
            color: "text",
          },
          {
            label: "Aggregate by count ",
            onClick: () => {
              aggSelection.set(`count_${field.label}`, {
                count: { field: field.label },
              });
              onAggregationSelectionChange(aggSelection);
            },
            size: "xs",
            color: "text",
          },
          {
            label: "Aggregate by percentile",
            onClick: () => {
              aggSelection.set(`percentiles_${field.label}`, {
                percentiles: { field: field.label, percents: [1, 5, 25, 99] },
              });
              onAggregationSelectionChange(aggSelection);
            },
            size: "xs",
            color: "text",
          },
          {
            label: "Aggregate by scripted metrics ",
            onClick: () => {
              aggSelection.set(`scripted_metric_${field.label}`, {
                scripted_metric: {
                  init_script: "",
                  map_script: "",
                  combine_script: "",
                  reduce_script: "",
                },
              });
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
  const [visibleColumns, setVisibleColumns] = useState(() => columns.map(({ id }) => id));
  const [data, setData] = useState([]);
  const [dataCount, setDataCount] = useState<number>(0);
  const [groupSelection, setGroupSelection] = useState<TransformGroupItem[]>([]);
  let exMap = new Map();
  exMap.set("EXXX", { sum: { field: "order_date" } });
  const [aggSelection, setAggSelection] = useState(exMap);
  console.log(JSON.stringify(exMap.get("EXXX")));

  const fetchData = useCallback(async () => {
    console.log("Entering fetchData...");
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
  }, [fetchData]);

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
      //debug use
      console.log("From: " + pageIndex * size);
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
    //Debug use
    // console.log("rowIndex: " + rowIndex + " columnId: " + columnId + " data: " + JSON.stringify(data[rowIndex]._source[columnId]));
    if (!loading && data.hasOwnProperty(rowIndex)) return data[rowIndex]._source[columnId] ? data[rowIndex]._source[columnId] : null;
    return null;
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
        <p>{`Viewing sample data from index ${sourceIndex}, filtered by order.type:sales_order, order.success:true`}</p>
      </EuiText>
      <EuiSpacer size="s" />
      {/*TODO: add rowCount*/}
      <EuiDataGrid
        aria-label="Define transforms"
        columns={columns}
        columnVisibility={{ visibleColumns, setVisibleColumns }}
        rowCount={dataCount}
        renderCellValue={renderCellValue}
        sorting={{ columns: sortingColumns, onSort }}
        pagination={{
          ...pagination,
          pageSizeOptions: [5, 10, 20, 50],
          onChangeItemsPerPage: onChangeItemsPerPage,
          onChangePage: onChangePage,
        }}
      />
      <EuiSpacer />
      {/*Debug use*/}
      {JSON.stringify(groupSelection)}
      {JSON.stringify(aggSelection)}
    </ContentPanel>
  );
}
