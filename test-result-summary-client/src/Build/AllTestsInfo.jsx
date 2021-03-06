import React, { Component } from 'react';
import TestBreadcrumb from './TestBreadcrumb';
import { SearchOutput } from '../Search/';
import { getParams } from '../utils/query';
import TestTable from './TestTable';
import './table.css';

export default class Build extends Component {
    state = {
        parents: [],
        testData: [],
    };

    async componentDidMount() {
        await this.updateData();
    }

    async updateData() {
        const { buildId, limit } = getParams( this.props.location.search );
        let limitParam = "";
        if (limit) {
            limitParam = `&limit=${limit}`;
        }
        const fetchBuild = await fetch( `/api/getAllTestsWithHistory?buildId=${buildId}${limitParam}`, {
            method: 'get'
        } );
        const builds = await fetchBuild.json();

        let testData = [];
        if ( builds[0].tests !== undefined ) {
            testData = builds[0].tests.map( test => {
                const ret = {
                    key: test._id,
                    sortName: test.testName,
                    testName: test.testName,
                    duration: test.duration,
                    machine: builds[0].machine,
                    sortMachine: builds[0].machine,
                };
                ret.action = {
                    testId: test._id,
                    testName: test.testName,
                };
                builds.forEach(({ tests, parentNum }, i) => {
                    if (!tests) {
                        return ret[i] = {
                            testResult: 'N/A',
                        };
                    }
                    const found = tests.find( t => t.testName === test.testName );
                    if ( found ) {
                        const { testResult, _id } = found
                        ret[i] = {
                            testResult,
                            testId: _id,
                        };
                    } else {
                        ret[i] = {
                            testResult: 'N/A',
                        };
                    }
                } );
                return ret;
            } );
        }

        testData.sort(( a, b ) => {
            let rt = a[0].testResult.localeCompare( b[0].testResult );
            if ( rt === 0 ) {
                return a.key.localeCompare( b.key );
            }
            return rt;
        } );

        this.setState( {
            parents: builds.map( element => { return { buildNum: element.parentNum, timestamp: element.parentTimestamp }; } ),
            testData,
        } );
    }

    render() {
        const { testData, parents } = this.state;
        const { buildId } = getParams( this.props.location.search );
        return <div>
            <TestBreadcrumb buildId={buildId} />
            <SearchOutput buildId={buildId} />
            <TestTable title={"Tests"} testData={testData} parents={parents} buildId={buildId} />
        </div>
    }
}