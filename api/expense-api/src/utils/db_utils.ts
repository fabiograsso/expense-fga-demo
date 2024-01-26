import { createKysely } from '@vercel/postgres-kysely';
import { Generated } from 'kysely';
import { DateTime } from 'luxon';
 
interface Database {
  'expense_reports': ExpenseReportsTable;
}

interface ExpenseReportsTable {
    report_id: Generated<number>;
    amount: number;
    merchant: string;
    description: string;
    submitter_id: string;
    approver_id?: string;
    approved_date?: Date;
    submitted_date: Date;
}
 
const db = createKysely<Database>();

export async function createExpenseReport (payload: createExpenseReportDto) {
    const { amount, merchant, description, submitter_id } = payload;
    const today = DateTime.now().toJSDate();

    const result = await db
        .insertInto('expense_reports')
        .values({ amount: amount, merchant: merchant, description: description, submitter_id: submitter_id, submitted_date: today })
        .returning('report_id')
        .execute();
    
    return result;
}

export async function approveExpenseReport (payload: approveExpenseReportDto) {
    const { approver_id, report_id } = payload;
    const today = DateTime.now().toJSDate();

    const result = await db
        .updateTable('expense_reports')
        .set({ approver_id: approver_id, approved_date: today })
        .where('report_id', '=', report_id)
        .returningAll()
        .execute();
    
    return result;
}

/**
 * NOTE: we can just get all of the reports from the DB for which the submitter_id, or the 
 * approver_id is the user_id. Then sort them separately.
 * 
 * @param payload
 * @returns 
 */
export async function getExpenseReports (payload: getExpenseReportDto) {
    const { user_id } = payload;
    const columns = [
        'report_id',
        'amount',
        'merchant',
        'description',
        'submitter_id',
        'approver_id',
        'approved_date',
        'submitted_date'
    ]

    const result = await db
        .selectFrom('expense_reports')
        .select(columns)
        .where((eb) => eb('submitter_id', '=', user_id).or('approver_id', '=', user_id))
        .execute();

    return result;
}

export type createExpenseReportDto = {
    amount: number;
    merchant: string;
    description: string;
    submitter_id: string;
}

export type approveExpenseReportDto = {
    report_id: number;
    approver_id: string;
}

export type getExpenseReportDto = {
    user_id: string;
}