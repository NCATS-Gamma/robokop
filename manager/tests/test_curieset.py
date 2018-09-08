#!/usr/bin/env python

import json
from manager.flowbokop import CurieSet

if __name__ == '__main__':

    a = {'curie': 'a'}
    c = {'curie': 'c'}

    ab = [
        {'curie': 'a'},
        {'curie': 'b'}
    ]

    ac = [
        {'curie': 'a', 'extra': 'a'},
        {'curie': 'c'}
    ]

    aDict = {
        'ab': ab,
        'ac': ac
    }

    aDict2 = {
        'a': a,
        'c': c
    }

    print("a")
    print(CurieSet.to_curie_list(CurieSet(a)))
    print("1")
    print(CurieSet.to_curie_list(CurieSet(ab)))
    print("2")
    print(CurieSet.to_curie_list(CurieSet(ac)))
    print("Union")
    print(CurieSet.to_curie_list(CurieSet(aDict).union()))
    print("Union2")
    print(CurieSet.to_curie_list(CurieSet(aDict2).union()))
    print("Intersect")
    print(CurieSet.to_curie_list(CurieSet(aDict).intersect()))
