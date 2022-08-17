'use strict';

exports.getNodes = function () {
  return nodes;
}

exports.getRelations = function () {
  return relations;
}

const nodes = [
  {
    title: 'order',
    kTitle: '주문',
    kafkaTopic: 'order',
    include: [
      'sid', 'uid', 'orderDate', 'description', 'photoList'
    ],
    hourLimit: 1
  },
  {
    title: 'lgs',
    kTitle: '배송',
    kafkaTopic: 'lgs',
    include: [
      'sid', 'uid', 'orderDate', 'description', 'photoList', 'address'
    ],
    hourLimit: 48
  },
  {
    title: 'snt',
    kTitle: '분류및과금',
    kafkaTopic: 'snt',
    include: [
      'sid', 'uid', 'orderDate', 'description', 'photoList'
    ],
    hourLimit: 5
  },
  {
    title: 'laundry',
    kTitle: '세탁',
    kafkaTopic: 'laundry',
    include: [
      'sid', 'uid', 'orderDate', 'description', 'photoList'
    ],
    hourLimit: 24
  },
  {
    title: 'storage',
    kTitle: '보관',
    kafkaTopic: 'storage',
    include: [
      'sid', 'uid', 'orderDate', 'description', 'photoList'
    ],
    hourLimit: 0
  },
  {
    title: 'secondhand',
    kTitle: '중고',
    kafkaTopic: 'secondhand',
    include: [
      'sid', 'uid', 'orderDate', 'description', 'photoList'
    ],
    hourLimit: 0
  },
  {
    title: 'billing',
    kTitle: '빌링',
    kafkaTopic: 'billing',
    include: [
      'sid', 'uid', 'orderDate', 'amount'
    ],
    hourLimit: 24
  },
]

const relations = [
  {
    process: 'P_001',
    description: '세탁주문',
    steps: [
      {
        from: 'order',
        to: 'lgs'
      },
      {
        from: 'lgs',
        to: 'snt'
      },
      {
        from: 'snt',
        to: 'billing',
        condition: {
          isSortingDone: true
        }
      },
      {
        from: 'billing',
        to: 'snt',
        condition: {
          isPaid: true
        }
      },
      {
        from: 'snt',
        to: 'laundry'
      },
      {
        from: 'laundry',
        to: 'lgs',
        condition: {
          isLaundryDone: true
        }
      },
      {
        from: 'lgs',
        to: 'order',
        condition: {
          isDeliveryDone: true
        }
      },
    ]
  },
  {
    process: 'P_002',
    description: '세탁_후_보관_주문_입고',
    steps: [
      {
        from: 'order',
        to: 'lgs'
      },
      {
        from: 'lgs',
        to: 'snt'
      },
      {
        from: 'snt',
        to: 'billing'
      },
      {
        from: 'billing',
        to: 'snt',
        condition: {
          isPaid: true
        }
      },
      {
        from: 'snt',
        to: 'laundry',
      },
      {
        from: 'laundry',
        to: 'storage',
        condition: {
          isLaundryDone: true
        }
      },
      {
        from: 'storage',
        to: 'order'
      },
    ]
  },
  {
    process: 'P_003',
    description: '보관_주문_출고',
    steps: [
      {
        from: 'order',
        to: 'storage'
      },
      {
        from: 'storage',
        to: 'lgs'
      },
      {
        from: 'lgs',
        to: 'order'
      },
    ]
  },
  {
    process: 'P_004',
    description: '세탁_없이_보관_주문_입고',
    steps: [
      {
        from: 'order',
        to: 'lgs'
      },
      {
        from: 'lgs',
        to: 'snt'
      },
      {
        from: 'snt',
        to: 'billing'
      },
      {
        from: 'billing',
        to: 'snt'
      },
      {
        from: 'snt',
        to: 'storage'
      },
      {
        from: 'storage',
        to: 'order'
      },
    ]
  },
  {
    process: 'P_005',
    description: '중고_판매_입고',
    steps: [
      {
        from: 'order',
        to: 'lgs'
      },
      {
        from: 'lgs',
        to: 'secondhand'
      },
      {
        from: 'secondhand',
        to: 'order'
      },
    ]
  },
  {
    process: 'P_006',
    description: '중고_판매_세탁_없이_출고',
    steps: [
      {
        from: 'order',
        to: 'secondhand'
      },
      {
        from: 'secondhand',
        to: 'billing'
      },
      {
        from: 'billing',
        to: 'secondhand'
      },
      {
        from: 'secondhand',
        to: 'lgs'
      },
      {
        from: 'lgs',
        to: 'order'
      },
    ]
  },
  {
    process: 'P_007',
    description: '중고_판매_세탁후_출고',
    steps: [
      {
        from: 'order',
        to: 'secondhand'
      },
      {
        from: 'secondhand',
        to: 'billing'
      },
      {
        from: 'billing',
        to: 'secondhand'
      },
      {
        from: 'secondhand',
        to: 'laundry'
      },
      {
        from: 'laundry',
        to: 'lgs'
      },
      {
        from: 'lgs',
        to: 'order'
      },
    ]
  },
]
