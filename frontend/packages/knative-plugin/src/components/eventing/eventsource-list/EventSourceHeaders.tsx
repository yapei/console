import { sortable } from '@patternfly/react-table';

const EventSourceHeaders = () => {
  return [
    {
      title: 'Name',
      sortField: 'metadata.name',
      transforms: [sortable],
      //   props: { className: tableColumnClasses[0] },
    },
    {
      title: 'Namespace',
      sortField: 'metadata.namespace',
      transforms: [sortable],
      //   props: { className: tableColumnClasses[1] },
    },
    {
      title: 'Type',
      sortField: 'kind',
      transforms: [sortable],
      //   props: { className: tableColumnClasses[2] },
    },
    {
      title: 'Created',
      sortField: 'metadata.creationTimestamp',
      transforms: [sortable],
      //   props: { className: tableColumnClasses[4] },
    },
    {
      title: '',
      //   props: { className: tableColumnClasses[8] },
    },
  ];
};

export default EventSourceHeaders;
