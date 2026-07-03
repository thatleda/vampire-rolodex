import type { Patient } from '../../server/src/schemas.ts'
import { createColumnHelper, flexRender, getCoreRowModel, getPaginationRowModel, useReactTable } from '@tanstack/react-table'
import { useMemo, useState } from 'react'
import { formatDate } from './utils/formatDate.ts'
import { trpc } from './utils/trpc.ts'

const LAB_COLUMNS = [
  { key: 'creatine', label: 'Creatine' },
  { key: 'chloride', label: 'Chloride' },
  { key: 'fasting_glucose', label: 'Fasting Glucose' },
  { key: 'potassium', label: 'Potassium' },
  { key: 'sodium', label: 'Sodium' },
  { key: 'total_calcium', label: 'Calcium' },
  { key: 'total_protein', label: 'Protein' },
] as const

interface TableRow {
  patientId: string
  testDate: string | null
  results: Patient['observations'][number]['results'] | null
}

function buildRows(patients: Patient[]): TableRow[] {
  return patients.flatMap((patient): TableRow[] =>
    patient.observations.length === 0
      ? [{ patientId: patient.id, testDate: null, results: null }]
      : patient.observations.map(observation => ({
          patientId: patient.id,
          testDate: observation.testDate,
          results: observation.results,
        })),
  )
}

const columnHelper = createColumnHelper<TableRow>()

const columns = [
  columnHelper.accessor('patientId', { header: 'Patient' }),
  columnHelper.accessor('testDate', {
    header: 'Test Date',
    cell: info => (info.getValue() ? formatDate(info.getValue()!) : null),
  }),
  ...LAB_COLUMNS.map(column =>
    columnHelper.display({
      id: column.key,
      header: column.label,
      cell: ({ row }) => {
        const result = row.original.results?.[column.key]
        return result ? `${result.value} ${result.unit}` : '-'
      },
    }),
  ),
]

export function PatientsTable() {
  const utils = trpc.useUtils()
  const patientsQuery = trpc.patients.list.useQuery()
  const resetMutation = trpc.patients.reset.useMutation({
    onSuccess: () => utils.patients.list.invalidate(),
  })
  const addNewMutation = trpc.patients.addNew.useMutation({
    onSuccess: () => utils.patients.list.invalidate(),
  })
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })

  const rows = useMemo(() => buildRows(patientsQuery.data ?? []), [patientsQuery.data])

  const table = useReactTable({
    data: rows,
    columns,
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  if (patientsQuery.isPending) {
    return <p>Loading...</p>
  }

  if (patientsQuery.isError) {
    return <p>Failed to load patients.</p>
  }

  return (
    <div>
      <nav aria-label="Data actions">
        <button type="button" onClick={() => resetMutation.mutate()}>
          Reset
        </button>
        <button type="button" onClick={() => addNewMutation.mutate()}>
          Add new data
        </button>
      </nav>
      <table>
        <thead>
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <th key={header.id}>{flexRender(header.column.columnDef.header, header.getContext())}</th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map(row =>
            row.original.testDate === null
              ? (
                  <tr key={row.id}>
                    <td>{row.original.patientId}</td>
                    <td colSpan={LAB_COLUMNS.length + 1}>No observations recorded</td>
                  </tr>
                )
              : (
                  <tr key={row.id}>
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                    ))}
                  </tr>
                ),
          )}
        </tbody>
      </table>
      <nav aria-label="Pagination">
        <button type="button" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
          Previous
        </button>
        <span>
          Page
          {' '}
          {table.getState().pagination.pageIndex + 1}
          {' '}
          of
          {' '}
          {table.getPageCount()}
        </span>
        <button type="button" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
          Next
        </button>
      </nav>
    </div>
  )
}
