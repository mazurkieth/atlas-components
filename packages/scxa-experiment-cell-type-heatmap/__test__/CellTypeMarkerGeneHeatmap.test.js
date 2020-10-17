import React from 'react'
import Enzyme from 'enzyme'
import {shallow} from 'enzyme'
import Adapter from 'enzyme-adapter-react-16'

import '@babel/polyfill'
import CellTypeMarkerGeneHeatmap from '../src/CellTypeMarkerGeneHeatmap'

Enzyme.configure({ adapter: new Adapter() })

describe(`CellTypeMarkerGeneHeatmap`, () => {
  test(`creates plotlines for every cell type`, () => {
    const wrapper = shallow(<CellTypeMarkerGeneHeatmap
      data={[
        {
          x: 0,
          y: 0,
          geneName: `foo`,
          value: 13,
          cellTypeValue: `1`,
          cellTypeValueWhereMarker: `1`
        },
        {
          x: 1,
          y: 1,
          geneName: `bar`,
          value: 2,
          cellTypeValue: `2`,
          cellTypeValueWhereMarker: `2`
        },
        {
          x: 2,
          y: 2,
          geneName: `foobar`,
          value: 1,
          cellTypeValue: `3`,
          cellTypeValueWhereMarker: `3`
        }
      ]}
      xAxisCategories={[`1`, `2`, `3`]}
      yAxisCategories={[`a`, `b`, `c`]}
      chartHeight={200}
      heatmapRowHeight={20}
      hasDynamicHeight={false}
      species={`species`} />)

    const chartOptions = wrapper.props().options

    expect(chartOptions.yAxis.plotLines).toHaveLength(3)
  })

  test(`does have data export options and a styled button`, () => {
    const wrapper = shallow(<CellTypeMarkerGeneHeatmap
      data={[
        {
          x: 0,
          y: 0,
          geneName: `foo`,
          value: 13,
          cellType: `1`,
          cellTypeWhereMarker: `1`
        }
      ]}
      xAxisCategories={[`1`, `2`, `3`]}
      yAxisCategories={[`a`, `b`, `c`]}
      chartHeight={200}
      heatmapRowHeight={20}
      hasDynamicHeight={false}
      species={`species`} />)

    const chartOptions = wrapper.props().options

    expect(chartOptions.exporting.buttons.contextButton.text).toEqual(
      `Download`)

    expect(chartOptions.exporting.buttons.contextButton.symbol).toEqual(`download`)

    expect(chartOptions.exporting.buttons.contextButton.menuItems).toEqual(
      [
        `downloadPNG`,
        `downloadJPEG`,
        `downloadPDF`,
        `downloadSVG`,
        `separator`,
        `downloadCSV`,
        `downloadXLS`
      ]
    )
  })
})
