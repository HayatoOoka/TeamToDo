# app/controllers/api/members_controller.rb

module Api
  class MembersController < ApplicationController
    skip_before_action :verify_authenticity_token, raise: false

    def index
      if params[:team_id]
        @members = Member.where(team_id: params[:team_id])
      elsif params[:user_id]
        @members = Member.where(user_id: params[:user_id])
      else
        @members = Member.all
      end
      render json: @members
    end

    def show
      @member = find_member
      if @member
        render json: @member
      else
        render json: { error: 'Member not found' }, status: :not_found
      end
    end

    def create
      @member = Member.new(member_params)
      if @member.save
        render json: @member, status: :created
      else
        render json: @member.errors, status: :unprocessable_entity
      end
    end

    def update
      @member = find_member
      if @member
        if @member.update(member_params_for_update)
          render json: @member
        else
          render json: @member.errors, status: :unprocessable_entity
        end
      else
        render json: { error: 'Member not found' }, status: :not_found
      end
    end

    def destroy
      @member = find_member
      if @member
        @member.destroy
        head :no_content
      else
        render json: { error: 'Member not found' }, status: :not_found
      end
    end

    private

    def member_params
      params.require(:member).permit(:user_id, :team_id, :role)
    end

    def member_params_for_update
      params.require(:member).permit(:role)
    end

    def find_member
      Member.find_by(id: params[:id])
    end
  end
end